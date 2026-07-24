import {
  getRelationshipDefinition,
  persistedEntityTypeToCanonical,
  relationshipRegistry,
} from "@/lib/relationships/relationshipRegistry";
import type {
  RelationshipEntityType,
  RelationshipMetadataField,
  RelationshipTypeDefinition,
} from "@/types/relationship";

export type PersistedRelationshipLike = {
  sourceType: string;
  sourceId: string;
  relationType: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export type RelationshipValidationIssueCode =
  | "UNREGISTERED_TYPE"
  | "INVALID_SOURCE_ENTITY_TYPE"
  | "INVALID_TARGET_ENTITY_TYPE"
  | "INVALID_SELF_REFERENCE"
  | "INVALID_METADATA_FIELD"
  | "DEPRECATED_TYPE";

export type RelationshipValidationIssue = {
  code: RelationshipValidationIssueCode;
  message: string;
  relationType: string;
};

export function toCanonicalRelationshipEntityType(
  value: string,
): RelationshipEntityType | undefined {
  return persistedEntityTypeToCanonical[value.toLowerCase()];
}

export function isRelationshipTypeRegistered(type: string): boolean {
  return Boolean(getRelationshipDefinition(type));
}

export function isRelationshipTypeActive(type: string): boolean {
  return getRelationshipDefinition(type)?.status === "active";
}

export function isSourceEntityTypeValid(
  definition: RelationshipTypeDefinition,
  sourceType: string,
): boolean {
  const canonicalSource = toCanonicalRelationshipEntityType(sourceType);
  return (
    canonicalSource === definition.sourceEntityType ||
    Boolean(definition.compatibleEntityPairs?.some((pair) => pair.sourceEntityType === canonicalSource))
  );
}

export function isTargetEntityTypeValid(
  definition: RelationshipTypeDefinition,
  targetType: string,
): boolean {
  const canonicalTarget = toCanonicalRelationshipEntityType(targetType);
  return (
    canonicalTarget === definition.targetEntityType ||
    Boolean(definition.compatibleEntityPairs?.some((pair) => pair.targetEntityType === canonicalTarget))
  );
}

export function isSelfReferenceAllowed(
  definition: RelationshipTypeDefinition,
  relationship: Pick<PersistedRelationshipLike, "sourceType" | "sourceId" | "targetType" | "targetId">,
): boolean {
  if (definition.allowSelfReference) return true;
  return !(
    relationship.sourceType === relationship.targetType &&
    relationship.sourceId === relationship.targetId
  );
}

export function isMetadataShapeAllowed(
  definition: RelationshipTypeDefinition,
  metadata: Record<string, unknown> | undefined,
): boolean {
  if (!metadata) return true;
  const allowed = new Set<RelationshipMetadataField>(definition.supportedMetadataFields);
  return Object.keys(metadata).every((key) => allowed.has(key as RelationshipMetadataField));
}

export function validateRelationship(
  relationship: PersistedRelationshipLike,
): RelationshipValidationIssue[] {
  const definition = getRelationshipDefinition(relationship.relationType);
  if (!definition) {
    return [{
      code: "UNREGISTERED_TYPE",
      message: `Relationship type is not registered: ${relationship.relationType}`,
      relationType: relationship.relationType,
    }];
  }

  const issues: RelationshipValidationIssue[] = [];
  const canonicalSource = toCanonicalRelationshipEntityType(relationship.sourceType);
  const canonicalTarget = toCanonicalRelationshipEntityType(relationship.targetType);
  const primaryPair =
    canonicalSource === definition.sourceEntityType &&
    canonicalTarget === definition.targetEntityType;
  const compatiblePair = definition.compatibleEntityPairs?.some(
    (pair) => pair.sourceEntityType === canonicalSource && pair.targetEntityType === canonicalTarget,
  );

  if (!primaryPair && !compatiblePair) {
    issues.push({
      code: "INVALID_SOURCE_ENTITY_TYPE",
      message: `${relationship.relationType} expects ${definition.sourceEntityType} -> ${definition.targetEntityType}.`,
      relationType: relationship.relationType,
    });
    issues.push({
      code: "INVALID_TARGET_ENTITY_TYPE",
      message: `${relationship.relationType} received ${canonicalSource ?? relationship.sourceType} -> ${canonicalTarget ?? relationship.targetType}.`,
      relationType: relationship.relationType,
    });
  }
  if (!isSelfReferenceAllowed(definition, relationship)) {
    issues.push({
      code: "INVALID_SELF_REFERENCE",
      message: `${relationship.relationType} does not allow self-reference.`,
      relationType: relationship.relationType,
    });
  }
  if (!isMetadataShapeAllowed(definition, relationship.metadata)) {
    issues.push({
      code: "INVALID_METADATA_FIELD",
      message: `${relationship.relationType} contains unsupported metadata fields.`,
      relationType: relationship.relationType,
    });
  }
  if (definition.status === "deprecated") {
    issues.push({
      code: "DEPRECATED_TYPE",
      message: `${relationship.relationType} is deprecated.`,
      relationType: relationship.relationType,
    });
  }

  return issues;
}

export function findRelationshipRegistryConflicts() {
  const keys = new Map<string, RelationshipTypeDefinition[]>();
  relationshipRegistry.forEach((definition) => {
    keys.set(definition.key, [...(keys.get(definition.key) ?? []), definition]);
  });

  return [...keys.entries()]
    .filter(([, definitions]) => definitions.length > 1)
    .map(([key, definitions]) => ({ key, definitions }));
}

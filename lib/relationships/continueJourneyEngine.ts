import "server-only";

import { RelationshipPolicyEngine } from "@/lib/relationships/relationshipPolicyEngine";
import { RelationshipService } from "@/lib/relationships/relationshipService";
import type {
  ContinueJourneyCategory,
  ContinueJourneyGroup,
  ContinueJourneyItem,
  ContinueJourneyOptions,
  ContinueJourneyResult,
  JourneyExplanation,
} from "@/types/continueJourney";
import type {
  RelationshipEdge,
  RelationshipEntityReference,
  RelationshipEntityType,
} from "@/types/relationship";

const supportedEntityTypes: RelationshipEntityType[] = ["MOVIE", "PERSON", "COUNTRY", "MOVEMENT"];

function domainTitle(entity: RelationshipEntityReference): string {
  return entity.id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function itemKey(item: ContinueJourneyItem): string {
  return `${item.entityType}:${item.entityId}:${item.relationshipType}:${item.metadata?.direction ?? "outgoing"}`;
}

function deterministicSort(a: ContinueJourneyItem, b: ContinueJourneyItem): number {
  return (
    a.priority - b.priority ||
    a.category.localeCompare(b.category) ||
    a.relationshipType.localeCompare(b.relationshipType) ||
    a.entityType.localeCompare(b.entityType) ||
    a.entityId.localeCompare(b.entityId)
  );
}

function uniqueItems(items: ContinueJourneyItem[]): ContinueJourneyItem[] {
  const unique = new Map<string, ContinueJourneyItem>();
  for (const item of [...items].sort(deterministicSort)) {
    if (!unique.has(itemKey(item))) unique.set(itemKey(item), item);
  }
  return [...unique.values()];
}

function relationshipExplanation(
  edge: RelationshipEdge,
  direction: "outgoing" | "incoming",
): JourneyExplanation {
  return {
    kind: edge.isCurated ? "EDITORIAL_CONTEXT" : direction === "outgoing" ? "DIRECT_RELATIONSHIP" : "INVERSE_RELATIONSHIP",
    relationshipType: edge.type,
    source: {
      id: edge.source.id,
      entityType: edge.source.type,
    },
    target: {
      id: edge.target.id,
      entityType: edge.target.type,
    },
    metadata: {
      direction,
      relationshipClass: edge.class,
      provenanceSource: edge.provenance.source,
    },
  };
}

function edgeToItem(
  edge: RelationshipEdge,
  source: RelationshipEntityReference,
  direction: "outgoing" | "incoming",
  includeMetadata: boolean,
  policyEngine: RelationshipPolicyEngine,
): ContinueJourneyItem {
  const entity = direction === "outgoing" ? edge.target : edge.source;
  const policy = policyEngine.getPolicy(edge.type);
  const category = policyEngine.getGroup(edge.type);

  return {
    id: `${source.type}:${source.id}:${edge.type}:${entity.type}:${entity.id}:${direction}`,
    entityType: entity.type,
    entityId: entity.id,
    relationshipType: edge.type,
    title: domainTitle(entity),
    subtitle: policy?.metadata?.groupTitle,
    explanation: relationshipExplanation(edge, direction),
    priority: policyEngine.getPriority(edge.type),
    category,
    metadata: includeMetadata
      ? {
          direction,
          sourceEntity: edge.source,
          targetEntity: edge.target,
          relationshipClass: edge.class,
          provenanceSource: edge.provenance.source,
          relationship: edge,
        }
      : {
          direction,
          sourceEntity: edge.source,
          targetEntity: edge.target,
        },
  };
}

export class ContinueJourneyEngine {
  constructor(
    private readonly relationshipService = new RelationshipService(),
    private readonly policyEngine = new RelationshipPolicyEngine(),
  ) {}

  async buildJourney(
    source: RelationshipEntityReference,
    options: ContinueJourneyOptions = {},
  ): Promise<ContinueJourneyResult> {
    return this.buildForEntity(source, options);
  }

  async buildForEntity(
    source: RelationshipEntityReference,
    options: ContinueJourneyOptions = {},
  ): Promise<ContinueJourneyResult> {
    if (!supportedEntityTypes.includes(source.type)) {
      return {
        source,
        supported: false,
        groups: [],
        items: [],
        generatedAt: new Date(0).toISOString(),
        warnings: [`Unsupported entity type: ${source.type}`],
      };
    }

    const serviceOptions = {
      preferredRelationshipTypes: options.preferredRelationshipTypes,
      entityFilters: options.entityFilters,
      excludeEntityIds: options.excludeEntityIds,
      maximumResults: options.maximumResults,
      includeMetadata: options.includeMetadata,
    };
    const [outgoing, incoming] = await Promise.all([
      this.relationshipService.getOutgoingRelationships(source, serviceOptions),
      this.relationshipService.getIncomingRelationships(source, serviceOptions),
    ]);
    const items = uniqueItems([
      ...outgoing
        .filter((edge) => this.policyEngine.isVisible(edge.type))
        .filter((edge) => this.policyEngine.getPolicy(edge.type)?.supportsContinueJourney !== false)
        .map((edge) => edgeToItem(edge, source, "outgoing", options.includeMetadata === true, this.policyEngine)),
      ...incoming
        .filter((edge) => this.policyEngine.isVisible(edge.type))
        .filter((edge) => this.policyEngine.getPolicy(edge.type)?.supportsContinueJourney !== false)
        .map((edge) => edgeToItem(edge, source, "incoming", options.includeMetadata === true, this.policyEngine)),
    ]).filter((item) => !options.excludeEntityIds?.includes(item.entityId));
    const limitedItems = items.slice(0, options.maximumResults);

    return {
      source,
      supported: true,
      groups: this.groupJourney(limitedItems),
      items: limitedItems,
      generatedAt: new Date(0).toISOString(),
      warnings: this.validateJourneyItems(limitedItems),
    };
  }

  groupJourney(items: ContinueJourneyItem[]): ContinueJourneyGroup[] {
    const grouped = new Map<ContinueJourneyCategory, ContinueJourneyItem[]>();
    for (const item of uniqueItems(items)) {
      grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
    }

    return [...grouped.entries()]
      .map(([category, groupItems]) => ({
        id: category,
        title: this.policyEngine.getGroupDefinition(category)?.title ?? category,
        description: this.policyEngine.getGroupDefinition(category)?.description ?? "",
        priority: Math.min(...groupItems.map((item) => item.priority)),
        items: [...groupItems].sort(deterministicSort),
      }))
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  }

  validateJourney(result: ContinueJourneyResult): string[] {
    return [
      ...result.warnings,
      ...this.validateJourneyItems(result.items),
    ];
  }

  private validateJourneyItems(items: ContinueJourneyItem[]): string[] {
    const warnings: string[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      if (!item.explanation.relationshipType.trim()) warnings.push(`Missing explanation: ${item.id}`);
      const key = itemKey(item);
      if (seen.has(key)) warnings.push(`Duplicate suggestion: ${key}`);
      seen.add(key);
    }

    return warnings;
  }
}

export const continueJourneyCategories = new RelationshipPolicyEngine().getPolicies().reduce(
  (groups, policy) => ({
    ...groups,
    [policy.group]: {
      title: new RelationshipPolicyEngine().getGroupDefinition(policy.group)?.title ?? policy.group,
      description: new RelationshipPolicyEngine().getGroupDefinition(policy.group)?.description ?? "",
      priority: policy.priority,
    },
  }),
  {} as Record<ContinueJourneyCategory, { title: string; description: string; priority: number }>,
);
export const continueJourneySupportedEntityTypes = supportedEntityTypes;

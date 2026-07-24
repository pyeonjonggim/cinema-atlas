export type RelationshipEntityType =
  | "MOVIE"
  | "PERSON"
  | "COUNTRY"
  | "MOVEMENT"
  | "GENRE"
  | "LANGUAGE"
  | "COMPANY"
  | "AWARD";

export type FutureRelationshipEntityType =
  | "AWARD_CATEGORY"
  | "FESTIVAL"
  | "STUDIO"
  | "THEME"
  | "COLLECTION";

export type RelationshipClass =
  | "FACTUAL"
  | "EDITORIAL"
  | "DERIVED";

export type RelationshipSource =
  | "TMDB"
  | "EDITORIAL"
  | "SYSTEM";

export type RelationshipDirection = "OUTGOING";

export type RelationshipStatus = "active" | "deprecated";

export type RelationshipMetadataField =
  | "reason"
  | "weight"
  | "priority"
  | "confidence"
  | "note";

export type RelationshipEntityReference = {
  type: RelationshipEntityType;
  id: string;
};

export type RelationshipProvenance = {
  source: RelationshipSource;
  providerRecordId?: string;
  importedAt?: string;
  pipelineVersion?: string;
};

export type CanonicalRelationship = {
  id: string;
  type: string;
  source: RelationshipEntityReference;
  target: RelationshipEntityReference;
  class: RelationshipClass;
  provenance: RelationshipProvenance;
  metadata?: Partial<Record<RelationshipMetadataField, string | number>>;
  createdAt?: string;
  updatedAt?: string;
};

export type RelationshipEdge = CanonicalRelationship & {
  sourceType: RelationshipEntityType;
  sourceId: string;
  targetType: RelationshipEntityType;
  targetId: string;
  persistedSourceType: string;
  persistedTargetType: string;
  isCurated: boolean;
};

export type RelationshipNode = {
  type: RelationshipEntityType;
  id: string;
};

export type RelationshipResult = {
  edges: RelationshipEdge[];
  nodes: RelationshipNode[];
};

export type RelationshipQueryOptions = {
  relationshipTypes?: string[];
  sourceEntityTypes?: RelationshipEntityType[];
  targetEntityTypes?: RelationshipEntityType[];
  limit?: number;
  depth?: number;
  direction?: "outgoing" | "incoming" | "both";
};

export type RelationshipServiceOptions = RelationshipQueryOptions & {
  preferredRelationshipTypes?: string[];
  entityFilters?: RelationshipEntityType[];
  excludeEntityIds?: string[];
  maximumResults?: number;
  includeMetadata?: boolean;
  groupResults?: boolean;
};

export type RelatedEntity = RelationshipNode & {
  relationshipTypes: string[];
  direction: "outgoing" | "incoming";
  relationshipCount: number;
  relationships: RelationshipEdge[];
};

export type RelationshipGroup = {
  relationshipType: string;
  edges: RelationshipEdge[];
  relatedEntities: RelatedEntity[];
};

export type RelationshipSummary = {
  entity: RelationshipEntityReference;
  outgoingCount: number;
  incomingCount: number;
  totalCount: number;
  relationshipTypes: Array<{
    type: string;
    count: number;
  }>;
  groups: RelationshipGroup[];
};

export type RelationshipTypeDefinition = {
  key: string;
  sourceEntityType: RelationshipEntityType;
  targetEntityType: RelationshipEntityType;
  compatibleEntityPairs?: Array<{
    sourceEntityType: RelationshipEntityType;
    targetEntityType: RelationshipEntityType;
    note: string;
  }>;
  direction: RelationshipDirection;
  relationshipClass: RelationshipClass;
  inverseSemanticKey?: string;
  inverseLabel?: string;
  allowSelfReference: boolean;
  allowDuplicateEdges: boolean;
  supportedMetadataFields: RelationshipMetadataField[];
  status: RelationshipStatus;
  source: RelationshipSource;
  compatibilityNotes?: string;
};

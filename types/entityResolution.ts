import type { ExternalIds } from "@/types/catalog";
import type {
  CatalogConfidence,
  CatalogProvenance,
  CatalogProvenanceProvider,
  KnowledgeGraphEntityType,
} from "@/types/catalogPersistence";

export type ResolvableEntityType = "person" | "country" | "genre" | "language" | "company";

export type EntityAliasType =
  | "alternate-name"
  | "localized-name"
  | "former-name"
  | "stage-name"
  | "transliteration"
  | "abbreviation"
  | "provider-label";

export type EntityAlias = {
  value: string;
  normalizedValue: string;
  language?: string;
  script?: string;
  aliasType: EntityAliasType;
  provenance: CatalogProvenance;
  isPreferred?: boolean;
  createdAt: string;
};

export type ExternalEntityCandidateBase = {
  entityType: ResolvableEntityType;
  provider: CatalogProvenanceProvider;
  providerEntityId?: string;
  displayName: string;
  originalName?: string;
  aliases?: string[];
  externalIds?: ExternalIds;
  metadata?: Record<string, string | number | boolean | undefined>;
  sourceMovieId?: string;
  sourceRole?: string;
};

export type ExternalPersonCandidate = ExternalEntityCandidateBase & {
  entityType: "person";
  birthDate?: string;
  deathDate?: string;
  knownForDepartment?: string;
  profilePath?: string;
};

export type ExternalCountryCandidate = ExternalEntityCandidateBase & {
  entityType: "country";
  isoCode?: string;
  region?: string;
};

export type ExternalGenreCandidate = ExternalEntityCandidateBase & {
  entityType: "genre";
  providerGenreId?: string;
};

export type ExternalLanguageCandidate = ExternalEntityCandidateBase & {
  entityType: "language";
  iso6391?: string;
  iso6392?: string;
  nativeName?: string;
};

export type ExternalCompanyCandidate = ExternalEntityCandidateBase & {
  entityType: "company";
  originCountryId?: string;
};

export type ExternalEntityCandidate =
  | ExternalPersonCandidate
  | ExternalCountryCandidate
  | ExternalGenreCandidate
  | ExternalLanguageCandidate
  | ExternalCompanyCandidate;

export type NormalizedEntityCandidate = ExternalEntityCandidate & {
  normalizedName: string;
  comparisonName: string;
  normalizedAliases: string[];
};

export type EntityResolutionStatus =
  | "AUTO_RESOLVED"
  | "REVIEW_REQUIRED"
  | "NEW_ENTITY_CANDIDATE"
  | "CONFLICT"
  | "REJECTED";

export type EntityResolutionConflictCode =
  | "EXTERNAL_ID_CONFLICT"
  | "BIRTH_DATE_CONFLICT"
  | "AMBIGUOUS_NAME"
  | "PROVIDER_MAPPING_CONFLICT"
  | "COUNTRY_ALIAS_AMBIGUOUS"
  | "COMPANY_ORIGIN_CONFLICT";

export type EntityResolutionReviewReason =
  | "HIGH_CONFIDENCE_REVIEW"
  | "LOW_SCORE"
  | "NO_MATCH"
  | "MULTIPLE_CANDIDATES"
  | "ALIAS_ONLY_MATCH"
  | EntityResolutionConflictCode;

export type EntityMatchCandidate = {
  entityType: ResolvableEntityType;
  entityId: string;
  displayName: string;
  score: number;
  confidence: CatalogConfidence;
  reasons: string[];
  conflicts: EntityResolutionConflictCode[];
  matchedFields: string[];
};

export type EntityResolutionResult = {
  candidate: NormalizedEntityCandidate;
  status: EntityResolutionStatus;
  selectedEntityId?: string;
  alternatives: EntityMatchCandidate[];
  confidence: CatalogConfidence;
  reviewReasons: EntityResolutionReviewReason[];
};

export type EntityReviewAction =
  | "link-existing"
  | "create-new"
  | "add-alias"
  | "reject"
  | "defer";

export type EntityReviewQueueItem = {
  id: string;
  candidateType: ResolvableEntityType;
  incomingValue: string;
  sourceProvider: CatalogProvenanceProvider;
  sourceRecord?: string;
  bestCandidates: EntityMatchCandidate[];
  scores: number[];
  matchedFields: string[];
  conflicts: EntityResolutionConflictCode[];
  suggestedAction: EntityReviewAction;
  reviewReasons: EntityResolutionReviewReason[];
};

export type EntityResolutionRepository = {
  getEntityById(
    entityType: ResolvableEntityType,
    id: string,
  ): Promise<unknown | undefined>;
  getEntityByExternalId(
    entityType: ResolvableEntityType,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<unknown | undefined>;
  findEntitiesByNormalizedName(
    entityType: ResolvableEntityType,
    normalizedName: string,
  ): Promise<EntityMatchCandidate[]>;
  findEntitiesByAlias(
    entityType: ResolvableEntityType,
    normalizedAlias: string,
  ): Promise<EntityMatchCandidate[]>;
  listEntityCandidates(entityType: ResolvableEntityType): Promise<EntityMatchCandidate[]>;
  saveEntityAlias(
    entityType: ResolvableEntityType,
    entityId: string,
    alias: EntityAlias,
  ): Promise<void>;
  reserveExternalId(
    entityType: ResolvableEntityType,
    entityId: string,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<void>;
};

export type PendingGraphRelation = {
  sourceType: KnowledgeGraphEntityType;
  sourceId: string;
  relationType: string;
  unresolvedTarget: NormalizedEntityCandidate;
};


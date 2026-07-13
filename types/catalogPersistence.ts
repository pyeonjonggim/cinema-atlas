import type { CatalogEntityType, ExternalIds, MovieExternalMetadata } from "@/types/catalog";

export type CatalogRecordType =
  | "movie"
  | "person"
  | "country"
  | "genre"
  | "language"
  | "company"
  | "award"
  | "movement";

export type UserRecordType =
  | "user-movie"
  | "journal"
  | "collection"
  | "passport";

export type CatalogApprovalState =
  | "INGESTED"
  | "NORMALIZED"
  | "VALIDATED"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type CatalogProvenanceProvider =
  | "tmdb"
  | "imdb"
  | "wikidata"
  | "cinema-atlas-editorial"
  | "user-generated"
  | "system-derived"
  | "manual"
  | "mixed";

export type CatalogConfidence =
  | "exact"
  | "high"
  | "medium"
  | "low"
  | "editorial-confirmed";

export type CatalogProvenance = {
  provider: CatalogProvenanceProvider;
  providerRecordId?: string;
  importedAt: string;
  pipelineVersion: string;
};

export type CatalogApproval = {
  state: CatalogApprovalState;
  reason?: string;
  approvedAt?: string;
  approvedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

export type CatalogMovieRecord = {
  id: string;
  slug?: string;
  externalIds: ExternalIds;
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  year?: number;
  runtime?: number;
  externalMetadata: MovieExternalMetadata;
  approval: CatalogApproval;
  provenance: CatalogProvenance[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogPersonRecord = {
  id: string;
  name: string;
  externalIds?: ExternalIds;
  roles: Array<"director" | "writer" | "actor" | "producer" | "crew">;
  provenance: CatalogProvenance[];
};

export type CatalogCountryRecord = {
  id: string;
  name?: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type CatalogGenreRecord = {
  id: string;
  name?: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type CatalogLanguageRecord = {
  id: string;
  name?: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type CatalogCompanyRecord = {
  id: string;
  name?: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type CatalogAwardRecord = {
  id: string;
  name: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type CatalogMovementRecord = {
  id: string;
  name: string;
  externalIds?: ExternalIds;
  provenance: CatalogProvenance[];
};

export type ResolvedEntityReference = {
  entityType: CatalogEntityType | "person" | "company";
  entityId: string;
  confidence: CatalogConfidence;
  provenance: CatalogProvenance;
};

export type UnresolvedEntityReference = {
  entityType: CatalogEntityType | "person" | "company";
  label: string;
  externalIds?: ExternalIds;
  reason: "NO_MATCH" | "MULTIPLE_MATCHES" | "LOW_CONFIDENCE" | "REVIEW_REQUIRED";
  candidates?: EntityMatchCandidate[];
};

export type EntityMatchCandidate = {
  entityType: CatalogEntityType | "person" | "company";
  entityId: string;
  label: string;
  confidence: CatalogConfidence;
  matchReason: string;
};

export type EntityResolutionResult = {
  resolved: ResolvedEntityReference[];
  unresolved: UnresolvedEntityReference[];
};

export type KnowledgeGraphEntityType =
  | "movie"
  | "person"
  | "country"
  | "genre"
  | "language"
  | "company"
  | "award"
  | "movement"
  | "journey"
  | "study-topic";

export type KnowledgeGraphRelationType =
  | "MOVIE_DIRECTED_BY_PERSON"
  | "MOVIE_ACTED_BY_PERSON"
  | "MOVIE_WRITTEN_BY_PERSON"
  | "MOVIE_PRODUCED_IN_COUNTRY"
  | "MOVIE_HAS_GENRE"
  | "MOVIE_USES_LANGUAGE"
  | "MOVIE_PRODUCED_BY_COMPANY"
  | "MOVIE_WON_AWARD"
  | "MOVIE_PART_OF_MOVEMENT"
  | "MOVIE_REMAKE_OF_MOVIE"
  | "MOVIE_RELATED_TO_JOURNEY"
  | "DIRECTOR_INFLUENCED_BY_DIRECTOR"
  | "MOVIE_ESSENTIAL_FOR_COUNTRY"
  | "MOVIE_RECOMMENDED_STARTING_POINT";

export type KnowledgeGraphEdge = {
  id: string;
  sourceType: KnowledgeGraphEntityType;
  sourceId: string;
  relationType: KnowledgeGraphRelationType;
  targetType: KnowledgeGraphEntityType;
  targetId: string;
  provenance: CatalogProvenance;
  confidence: CatalogConfidence;
  isCurated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogRepositoryTransactionInput = {
  movie: CatalogMovieRecord;
  entities: {
    people: CatalogPersonRecord[];
    countries: CatalogCountryRecord[];
    genres: CatalogGenreRecord[];
    languages: CatalogLanguageRecord[];
    companies: CatalogCompanyRecord[];
  };
  edges: KnowledgeGraphEdge[];
};

export type CatalogRepository = {
  getMovieById(id: string): Promise<CatalogMovieRecord | undefined>;
  getMovieByExternalId(
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<CatalogMovieRecord | undefined>;
  createMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord>;
  updateMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord>;
  upsertMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord>;
  listMovies(): Promise<CatalogMovieRecord[]>;
  saveEntity(record: CatalogPersonRecord | CatalogCountryRecord | CatalogGenreRecord | CatalogLanguageRecord | CatalogCompanyRecord): Promise<void>;
  saveRelations(edges: KnowledgeGraphEdge[]): Promise<void>;
  saveApprovedMovieTransaction(input: CatalogRepositoryTransactionInput): Promise<CatalogMovieRecord>;
  getRelationsFrom(sourceType: KnowledgeGraphEntityType, sourceId: string): Promise<KnowledgeGraphEdge[]>;
  getRelationsTo(targetType: KnowledgeGraphEntityType, targetId: string): Promise<KnowledgeGraphEdge[]>;
  findEntityCandidates(entityType: KnowledgeGraphEntityType, label: string): Promise<EntityMatchCandidate[]>;
};


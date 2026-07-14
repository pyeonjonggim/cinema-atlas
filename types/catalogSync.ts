import type {
  CatalogApprovalState,
  CatalogCompanyRecord,
  CatalogCountryRecord,
  CatalogGenreRecord,
  CatalogLanguageRecord,
  CatalogMovieRecord,
  CatalogPersonRecord,
  CatalogProvenance,
  KnowledgeGraphEdge,
} from "@/types/catalogPersistence";

export type CatalogSyncMode =
  | "CREATE"
  | "UPDATE"
  | "REFRESH_METADATA"
  | "REBUILD_RELATIONS"
  | "DRY_RUN";

export type CatalogSyncInput = {
  canonicalMovie: CatalogMovieRecord;
  approvalState: CatalogApprovalState;
  resolvedEntities: {
    people: CatalogPersonRecord[];
    countries: CatalogCountryRecord[];
    genres: CatalogGenreRecord[];
    languages: CatalogLanguageRecord[];
    companies: CatalogCompanyRecord[];
  };
  unresolvedEntityLabels?: string[];
  incomingEdges: KnowledgeGraphEdge[];
  provenance: CatalogProvenance;
  qualityScore: number;
  sourceVersion: string;
  requestedBy: "system" | "editorial" | "import-pipeline";
  syncMode: CatalogSyncMode;
};

export type CatalogSyncPlan = {
  movieId: string;
  syncMode: CatalogSyncMode;
  movieCreate: boolean;
  movieUpdate: boolean;
  changedFields: string[];
  externalIdsToAdd: string[];
  externalIdsToRemove: string[];
  entitiesToCreate: string[];
  aliasesToAdd: string[];
  edgesToAdd: KnowledgeGraphEdge[];
  edgesToRemove: KnowledgeGraphEdge[];
  curatedEdgesPreserved: KnowledgeGraphEdge[];
  provenanceUpdate: CatalogProvenance;
  reviewItems: string[];
  affectedEntityIds: string[];
  affectedRoutes: string[];
  affectedCacheTags: string[];
  searchUpdateRequests: SearchIndexUpdateRequest[];
};

export type CatalogSyncEvent = {
  id: string;
  movieId: string;
  eventType:
    | "MOVIE_CREATED"
    | "MOVIE_UPDATED"
    | "RELATIONS_REBUILT"
    | "METADATA_REFRESHED"
    | "SYNC_FAILED"
    | "NO_CHANGE"
    | "REVIEW_REQUIRED";
  provider: CatalogProvenance["provider"];
  sourceRecordId?: string;
  changedFields: string[];
  addedEdges: string[];
  removedEdges: string[];
  status: "PASS" | "FAILED" | "BLOCKED" | "NO_CHANGE";
  errorCode?: string;
  startedAt: string;
  completedAt?: string;
  pipelineVersion: string;
};

export type CacheInvalidationRequest = {
  tag: string;
  reason: string;
};

export type RouteRevalidationRequest = {
  path: string;
  reason: string;
};

export type SearchIndexUpdateRequest = {
  entityType: "movie" | "person" | "country" | "genre" | "language" | "company";
  entityId: string;
  action: "UPSERT" | "DELETE" | "REINDEX";
  changedFields: string[];
  requestedAt: string;
};

export type CatalogSyncResult = {
  plan: CatalogSyncPlan;
  event: CatalogSyncEvent;
  cacheInvalidations: CacheInvalidationRequest[];
  routeRevalidations: RouteRevalidationRequest[];
  searchUpdateRequests: SearchIndexUpdateRequest[];
};

import type {
  CatalogSyncEvent,
  CatalogSyncInput,
  CatalogSyncPlan,
  CatalogSyncResult,
  RouteRevalidationRequest,
  SearchIndexUpdateRequest,
} from "@/types/catalogSync";
import type { CatalogMovieRecord, KnowledgeGraphEdge } from "@/types/catalogPersistence";

const computedRelationTypes = new Set([
  "MOVIE_DIRECTED_BY_PERSON",
  "MOVIE_ACTED_BY_PERSON",
  "MOVIE_WRITTEN_BY_PERSON",
  "MOVIE_PRODUCED_BY_PERSON",
  "MOVIE_PRODUCED_IN_COUNTRY",
  "MOVIE_HAS_GENRE",
  "MOVIE_USES_LANGUAGE",
  "MOVIE_PRODUCED_BY_COMPANY",
]);

function edgeKey(edge: Pick<KnowledgeGraphEdge, "sourceType" | "sourceId" | "relationType" | "targetType" | "targetId">): string {
  return [
    edge.sourceType,
    edge.sourceId,
    edge.relationType,
    edge.targetType,
    edge.targetId,
  ].join(":");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function compareMovieFields(
  existing: CatalogMovieRecord | undefined,
  incoming: CatalogMovieRecord,
): string[] {
  if (!existing) return ["movie"];

  const fields: Array<[string, unknown, unknown]> = [
    ["title", existing.title, incoming.title],
    ["originalTitle", existing.originalTitle, incoming.originalTitle],
    ["releaseDate", existing.releaseDate, incoming.releaseDate],
    ["year", existing.year, incoming.year],
    ["runtime", existing.runtime, incoming.runtime],
    ["overview", existing.externalMetadata.overview, incoming.externalMetadata.overview],
    ["poster", existing.externalMetadata.poster?.path, incoming.externalMetadata.poster?.path],
    ["backdrop", existing.externalMetadata.backdrop?.path, incoming.externalMetadata.backdrop?.path],
    [
      "countries",
      JSON.stringify(existing.externalMetadata.productionCountryIds ?? []),
      JSON.stringify(incoming.externalMetadata.productionCountryIds ?? []),
    ],
    [
      "genres",
      JSON.stringify(existing.externalMetadata.genreIds ?? []),
      JSON.stringify(incoming.externalMetadata.genreIds ?? []),
    ],
    [
      "languages",
      JSON.stringify(existing.externalMetadata.spokenLanguageIds ?? []),
      JSON.stringify(incoming.externalMetadata.spokenLanguageIds ?? []),
    ],
    [
      "companies",
      JSON.stringify(existing.externalMetadata.productionCompanyIds ?? []),
      JSON.stringify(incoming.externalMetadata.productionCompanyIds ?? []),
    ],
  ];

  return fields
    .filter(([, before, after]) => before !== after)
    .map(([field]) => field);
}

function affectedEntityIds(edges: KnowledgeGraphEdge[]): string[] {
  return unique(edges.map((edge) => `${edge.targetType}:${edge.targetId}`));
}

function cacheTags(movieId: string, edges: KnowledgeGraphEdge[]): string[] {
  const tags = ["catalog:movies", `movie:${movieId}`];
  edges.forEach((edge) => {
    if (edge.targetType === "person") {
      tags.push(`person:${edge.targetId}`, `director:${edge.targetId}`, `actor:${edge.targetId}`);
    }
    if (edge.targetType === "country") tags.push(`country:${edge.targetId}`);
    if (edge.targetType === "genre") tags.push(`genre:${edge.targetId}`);
    if (edge.targetType === "language") tags.push(`language:${edge.targetId}`);
    if (edge.targetType === "company") tags.push(`company:${edge.targetId}`);
  });
  return unique(tags);
}

function routeRevalidations(movieId: string, edges: KnowledgeGraphEdge[]): RouteRevalidationRequest[] {
  const paths = ["/movies", `/movies/${movieId}`];
  edges.forEach((edge) => {
    if (edge.targetType === "person") {
      paths.push(`/encyclopedia/directors/${edge.targetId}`);
      paths.push(`/encyclopedia/actors/${edge.targetId}`);
    }
    if (edge.targetType === "country") {
      paths.push(`/encyclopedia/countries/${edge.targetId}`);
    }
  });

  return unique(paths).map((path) => ({
    path,
    reason: `Catalog movie ${movieId} changed`,
  }));
}

function searchRequests(
  movieId: string,
  edges: KnowledgeGraphEdge[],
  changedFields: string[],
): SearchIndexUpdateRequest[] {
  const requestedAt = new Date().toISOString();
  const requests: SearchIndexUpdateRequest[] = [
    {
      entityType: "movie",
      entityId: movieId,
      action: "UPSERT",
      changedFields,
      requestedAt,
    },
  ];

  edges.forEach((edge) => {
    if (
      edge.targetType === "person" ||
      edge.targetType === "country" ||
      edge.targetType === "genre" ||
      edge.targetType === "language" ||
      edge.targetType === "company"
    ) {
      requests.push({
        entityType: edge.targetType,
        entityId: edge.targetId,
        action: "REINDEX",
        changedFields: [edge.relationType],
        requestedAt,
      });
    }
  });

  return requests;
}

export class CatalogSyncService {
  createSyncPlan(
    input: CatalogSyncInput,
    existingMovie: CatalogMovieRecord | undefined,
    existingEdges: KnowledgeGraphEdge[],
  ): CatalogSyncPlan {
    const incomingComputedEdges = input.incomingEdges.filter((edge) =>
      computedRelationTypes.has(edge.relationType),
    );
    const existingComputedEdges = existingEdges.filter(
      (edge) => computedRelationTypes.has(edge.relationType) && !edge.isCurated,
    );
    const curatedEdgesPreserved = existingEdges.filter(
      (edge) => edge.isCurated || !computedRelationTypes.has(edge.relationType),
    );

    const incomingKeys = new Set(incomingComputedEdges.map(edgeKey));
    const existingKeys = new Set(existingComputedEdges.map(edgeKey));
    const edgesToAdd = incomingComputedEdges.filter((edge) => !existingKeys.has(edgeKey(edge)));
    const edgesToRemove = existingComputedEdges.filter((edge) => !incomingKeys.has(edgeKey(edge)));
    const changedFields = compareMovieFields(existingMovie, input.canonicalMovie);
    const affectedEdges = [...edgesToAdd, ...edgesToRemove, ...curatedEdgesPreserved];
    const affectedCacheTags = cacheTags(input.canonicalMovie.id, affectedEdges);
    const affectedRoutes = routeRevalidations(input.canonicalMovie.id, affectedEdges).map(
      (item) => item.path,
    );

    return {
      movieId: input.canonicalMovie.id,
      syncMode: input.syncMode,
      movieCreate: !existingMovie && input.approvalState === "APPROVED",
      movieUpdate: Boolean(existingMovie && changedFields.length > 0),
      changedFields,
      externalIdsToAdd: [],
      externalIdsToRemove: [],
      entitiesToCreate: [
        ...input.resolvedEntities.people.map((entity) => `person:${entity.id}`),
        ...input.resolvedEntities.countries.map((entity) => `country:${entity.id}`),
        ...input.resolvedEntities.genres.map((entity) => `genre:${entity.id}`),
        ...input.resolvedEntities.languages.map((entity) => `language:${entity.id}`),
        ...input.resolvedEntities.companies.map((entity) => `company:${entity.id}`),
      ],
      aliasesToAdd: [],
      edgesToAdd,
      edgesToRemove,
      curatedEdgesPreserved,
      provenanceUpdate: input.provenance,
      reviewItems: input.unresolvedEntityLabels ?? [],
      affectedEntityIds: affectedEntityIds(affectedEdges),
      affectedRoutes,
      affectedCacheTags,
      searchUpdateRequests: searchRequests(input.canonicalMovie.id, affectedEdges, changedFields),
    };
  }

  emitSyncResult(input: CatalogSyncInput, plan: CatalogSyncPlan, status: CatalogSyncEvent["status"]): CatalogSyncResult {
    const now = new Date().toISOString();
    const eventType: CatalogSyncEvent["eventType"] =
      plan.reviewItems.length > 0
        ? "REVIEW_REQUIRED"
        : status === "NO_CHANGE"
          ? "NO_CHANGE"
          : plan.movieCreate
            ? "MOVIE_CREATED"
            : plan.edgesToAdd.length > 0 || plan.edgesToRemove.length > 0
              ? "RELATIONS_REBUILT"
              : plan.movieUpdate
                ? "MOVIE_UPDATED"
                : "NO_CHANGE";

    const event: CatalogSyncEvent = {
      id: `sync:${input.canonicalMovie.id}:${now}`,
      movieId: input.canonicalMovie.id,
      eventType,
      provider: input.provenance.provider,
      sourceRecordId: input.provenance.providerRecordId,
      changedFields: plan.changedFields,
      addedEdges: plan.edgesToAdd.map(edgeKey),
      removedEdges: plan.edgesToRemove.map(edgeKey),
      status,
      startedAt: now,
      completedAt: now,
      pipelineVersion: input.provenance.pipelineVersion,
    };

    return {
      plan,
      event,
      cacheInvalidations: plan.affectedCacheTags.map((tag) => ({
        tag,
        reason: `Catalog sync ${event.eventType}`,
      })),
      routeRevalidations: plan.affectedRoutes.map((path) => ({
        path,
        reason: `Catalog sync ${event.eventType}`,
      })),
      searchUpdateRequests: plan.searchUpdateRequests,
    };
  }
}

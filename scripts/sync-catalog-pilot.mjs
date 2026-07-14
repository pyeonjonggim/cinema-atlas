import fs from "node:fs/promises";
import path from "node:path";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  readPersistenceArtifacts,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const syncOutputRoot = path.resolve(pilotOutputRoot, "..", "catalog-sync-pilot");
const computedRelations = new Set([
  "MOVIE_DIRECTED_BY_PERSON",
  "MOVIE_ACTED_BY_PERSON",
  "MOVIE_WRITTEN_BY_PERSON",
  "MOVIE_PRODUCED_BY_PERSON",
  "MOVIE_PRODUCED_IN_COUNTRY",
  "MOVIE_HAS_GENRE",
  "MOVIE_USES_LANGUAGE",
  "MOVIE_PRODUCED_BY_COMPANY",
]);

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function edgeKey(edge) {
  return [
    edge.sourceType,
    edge.sourceId,
    edge.relationType,
    edge.targetType,
    edge.targetId,
  ].join(":");
}

async function writeSyncArtifact(fileName, payload) {
  await fs.mkdir(syncOutputRoot, { recursive: true });
  await fs.writeFile(path.join(syncOutputRoot, fileName), JSON.stringify(payload, null, 2));
}

function makeInput(movie, entities, edges, syncMode, unresolvedEntityLabels = []) {
  const provenance = {
    provider: "tmdb",
    providerRecordId: String(movie.externalIds?.tmdbId ?? movie.id),
    importedAt: now(),
    pipelineVersion: "catalog-sync-v1",
  };

  return {
    canonicalMovie: movie,
    approvalState: unresolvedEntityLabels.length > 0 ? "REVIEW_REQUIRED" : "APPROVED",
    resolvedEntities: entities,
    unresolvedEntityLabels,
    incomingEdges: edges,
    provenance,
    qualityScore: 95,
    sourceVersion: "catalog-sync-pilot",
    requestedBy: "import-pipeline",
    syncMode,
  };
}

function remapMovie(movie, targetId) {
  return {
    ...clone(movie),
    id: targetId,
    externalIds: {},
    title: `${movie.title} Sync Pilot`,
    createdAt: now(),
    updatedAt: now(),
  };
}

function remapEdges(edges, sourceId, targetId) {
  return edges
    .filter((edge) => edge.sourceType === "movie" && edge.sourceId === sourceId)
    .map((edge) => ({
      ...clone(edge),
      id: edgeKey({ ...edge, sourceId: targetId }),
      sourceId: targetId,
      createdAt: now(),
      updatedAt: now(),
    }));
}

function compareMovieFields(existing, incoming) {
  if (!existing) return ["movie"];
  return [
    ["title", existing.title, incoming.title],
    ["originalTitle", existing.originalTitle, incoming.originalTitle],
    ["releaseDate", existing.releaseDate, incoming.releaseDate],
    ["year", existing.year, incoming.year],
    ["runtime", existing.runtime, incoming.runtime],
    ["overview", existing.externalMetadata?.overview, incoming.externalMetadata?.overview],
    ["poster", existing.externalMetadata?.poster?.path, incoming.externalMetadata?.poster?.path],
    ["backdrop", existing.externalMetadata?.backdrop?.path, incoming.externalMetadata?.backdrop?.path],
    ["countries", JSON.stringify(existing.externalMetadata?.productionCountryIds ?? []), JSON.stringify(incoming.externalMetadata?.productionCountryIds ?? [])],
    ["genres", JSON.stringify(existing.externalMetadata?.genreIds ?? []), JSON.stringify(incoming.externalMetadata?.genreIds ?? [])],
    ["languages", JSON.stringify(existing.externalMetadata?.spokenLanguageIds ?? []), JSON.stringify(incoming.externalMetadata?.spokenLanguageIds ?? [])],
    ["companies", JSON.stringify(existing.externalMetadata?.productionCompanyIds ?? []), JSON.stringify(incoming.externalMetadata?.productionCompanyIds ?? [])],
  ]
    .filter(([, before, after]) => before !== after)
    .map(([field]) => field);
}

function createSyncPlan(input, existingMovie, existingEdges) {
  const incomingComputedEdges = input.incomingEdges.filter((edge) => computedRelations.has(edge.relationType));
  const existingComputedEdges = existingEdges.filter((edge) => computedRelations.has(edge.relationType) && !edge.isCurated);
  const curatedEdgesPreserved = existingEdges.filter((edge) => edge.isCurated || !computedRelations.has(edge.relationType));
  const incomingKeys = new Set(incomingComputedEdges.map(edgeKey));
  const existingKeys = new Set(existingComputedEdges.map(edgeKey));
  const edgesToAdd = incomingComputedEdges.filter((edge) => !existingKeys.has(edgeKey(edge)));
  const edgesToRemove = existingComputedEdges.filter((edge) => !incomingKeys.has(edgeKey(edge)));
  const changedFields = compareMovieFields(existingMovie, input.canonicalMovie);
  const affectedEdges = [...edgesToAdd, ...edgesToRemove, ...curatedEdgesPreserved];
  const affectedCacheTags = unique([
    "catalog:movies",
    `movie:${input.canonicalMovie.id}`,
    ...affectedEdges.flatMap((edge) => {
      if (edge.targetType === "person") return [`person:${edge.targetId}`, `director:${edge.targetId}`, `actor:${edge.targetId}`];
      if (edge.targetType === "country") return [`country:${edge.targetId}`];
      if (edge.targetType === "genre") return [`genre:${edge.targetId}`];
      if (edge.targetType === "language") return [`language:${edge.targetId}`];
      if (edge.targetType === "company") return [`company:${edge.targetId}`];
      return [];
    }),
  ]);
  const affectedRoutes = unique([
    "/movies",
    `/movies/${input.canonicalMovie.id}`,
    ...affectedEdges.flatMap((edge) => {
      if (edge.targetType === "person") return [`/encyclopedia/directors/${edge.targetId}`, `/encyclopedia/actors/${edge.targetId}`];
      if (edge.targetType === "country") return [`/encyclopedia/countries/${edge.targetId}`];
      return [];
    }),
  ]);

  return {
    movieId: input.canonicalMovie.id,
    syncMode: input.syncMode,
    movieCreate: !existingMovie && input.approvalState === "APPROVED",
    movieUpdate: Boolean(existingMovie && changedFields.length > 0),
    changedFields,
    edgesToAdd,
    edgesToRemove,
    curatedEdgesPreserved,
    reviewItems: input.unresolvedEntityLabels ?? [],
    affectedEntityIds: unique(affectedEdges.map((edge) => `${edge.targetType}:${edge.targetId}`)),
    affectedRoutes,
    affectedCacheTags,
    searchUpdateRequests: [
      {
        entityType: "movie",
        entityId: input.canonicalMovie.id,
        action: "UPSERT",
        changedFields,
        requestedAt: now(),
      },
      ...affectedEdges
        .filter((edge) => ["person", "country", "genre", "language", "company"].includes(edge.targetType))
        .map((edge) => ({
          entityType: edge.targetType,
          entityId: edge.targetId,
          action: "REINDEX",
          changedFields: [edge.relationType],
          requestedAt: now(),
        })),
    ],
  };
}

function emitSyncResult(input, plan, status) {
  const timestamp = now();
  const eventType =
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
  const event = {
    id: `sync:${input.canonicalMovie.id}:${timestamp}`,
    movieId: input.canonicalMovie.id,
    eventType,
    provider: input.provenance.provider,
    sourceRecordId: input.provenance.providerRecordId,
    changedFields: plan.changedFields,
    addedEdges: plan.edgesToAdd.map(edgeKey),
    removedEdges: plan.edgesToRemove.map(edgeKey),
    status,
    startedAt: timestamp,
    completedAt: timestamp,
    pipelineVersion: input.provenance.pipelineVersion,
  };
  return {
    plan,
    event,
    cacheInvalidations: plan.affectedCacheTags.map((tag) => ({ tag, reason: `Catalog sync ${event.eventType}` })),
    routeRevalidations: plan.affectedRoutes.map((routePath) => ({ path: routePath, reason: `Catalog sync ${event.eventType}` })),
    searchUpdateRequests: plan.searchUpdateRequests,
  };
}

async function getMovie(client, movieId) {
  const result = await client.query("SELECT * FROM catalog_movies WHERE id = $1", [movieId]);
  if (!result.rows[0]) return undefined;
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title,
    releaseDate: row.release_date
      ? row.release_date instanceof Date
        ? [
            row.release_date.getFullYear(),
            String(row.release_date.getMonth() + 1).padStart(2, "0"),
            String(row.release_date.getDate()).padStart(2, "0"),
          ].join("-")
        : String(row.release_date).slice(0, 10)
      : undefined,
    year: row.release_year,
    runtime: row.runtime,
    externalMetadata: row.external_metadata,
  };
}

async function getEdges(client, movieId) {
  const result = await client.query(
    `SELECT id, source_type, source_id, relation_type, target_type, target_id,
      provenance, confidence, is_curated, created_at, updated_at
     FROM knowledge_graph_edges
     WHERE source_type = 'movie' AND source_id = $1`,
    [movieId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    relationType: row.relation_type,
    targetType: row.target_type,
    targetId: row.target_id,
    provenance: row.provenance,
    confidence: row.confidence,
    isCurated: row.is_curated,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

async function upsertMovie(client, movie) {
  await client.query(
    `INSERT INTO catalog_movies (
      id, title, original_title, release_date, release_year, runtime,
      overview, original_language, poster_path, backdrop_path, external_metadata,
      approval_state, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      original_title = EXCLUDED.original_title,
      release_date = EXCLUDED.release_date,
      release_year = EXCLUDED.release_year,
      runtime = EXCLUDED.runtime,
      overview = EXCLUDED.overview,
      original_language = EXCLUDED.original_language,
      poster_path = EXCLUDED.poster_path,
      backdrop_path = EXCLUDED.backdrop_path,
      external_metadata = EXCLUDED.external_metadata,
      approval_state = EXCLUDED.approval_state,
      updated_at = EXCLUDED.updated_at`,
    [
      movie.id,
      movie.title,
      movie.originalTitle,
      movie.releaseDate,
      movie.year,
      movie.runtime,
      movie.externalMetadata?.overview,
      movie.externalMetadata?.spokenLanguageIds?.[0],
      movie.externalMetadata?.poster?.path,
      movie.externalMetadata?.backdrop?.path,
      JSON.stringify(movie.externalMetadata ?? {}),
      movie.approval?.state ?? "APPROVED",
      movie.createdAt ?? now(),
      movie.updatedAt ?? now(),
    ],
  );
}

async function upsertEdges(client, edges) {
  for (const edge of edges) {
    await client.query(
      `INSERT INTO knowledge_graph_edges (
        id, source_type, source_id, relation_type, target_type, target_id,
        provenance, confidence, is_curated, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (source_type, source_id, relation_type, target_type, target_id) DO UPDATE SET
        provenance = EXCLUDED.provenance,
        confidence = EXCLUDED.confidence,
        is_curated = EXCLUDED.is_curated,
        updated_at = EXCLUDED.updated_at`,
      [
        edgeKey(edge),
        edge.sourceType,
        edge.sourceId,
        edge.relationType,
        edge.targetType,
        edge.targetId,
        JSON.stringify(edge.provenance),
        edge.confidence,
        edge.isCurated,
        edge.createdAt,
        edge.updatedAt,
      ],
    );
  }
}

async function removeEdges(client, edges) {
  for (const edge of edges) {
    if (edge.isCurated || !computedRelations.has(edge.relationType)) continue;
    await client.query(
      `DELETE FROM knowledge_graph_edges
       WHERE source_type = $1 AND source_id = $2 AND relation_type = $3
        AND target_type = $4 AND target_id = $5 AND is_curated = false`,
      [edge.sourceType, edge.sourceId, edge.relationType, edge.targetType, edge.targetId],
    );
  }
}

async function insertSyncEvent(client, event) {
  await client.query(
    `INSERT INTO catalog_sync_events (
      id, movie_id, event_type, provider, source_record_id, changed_fields,
      added_edges, removed_edges, status, error_code, started_at, completed_at,
      pipeline_version, metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (id) DO NOTHING`,
    [
      event.id,
      event.movieId,
      event.eventType,
      event.provider,
      event.sourceRecordId,
      JSON.stringify(event.changedFields),
      JSON.stringify(event.addedEdges),
      JSON.stringify(event.removedEdges),
      event.status,
      event.errorCode,
      event.startedAt,
      event.completedAt,
      event.pipelineVersion,
      JSON.stringify({ pilot: true }),
    ],
  );
}

async function applyPlan(client, input, result) {
  if (result.plan.reviewItems.length > 0) {
    await insertSyncEvent(client, result.event);
    return;
  }
  await upsertMovie(client, input.canonicalMovie);
  await removeEdges(client, result.plan.edgesToRemove);
  await upsertEdges(client, result.plan.edgesToAdd);
  await insertSyncEvent(client, result.event);
}

async function runScenario(client, name, input) {
  const started = performance.now();
  const existingMovie = await getMovie(client, input.canonicalMovie.id);
  const existingEdges = await getEdges(client, input.canonicalMovie.id);
  const diffStarted = performance.now();
  const plan = createSyncPlan(input, existingMovie, existingEdges);
  const diffMs = performance.now() - diffStarted;
  const status =
    plan.reviewItems.length > 0
      ? "BLOCKED"
      : plan.changedFields.length || plan.edgesToAdd.length || plan.edgesToRemove.length || plan.movieCreate
        ? "PASS"
        : "NO_CHANGE";
  const result = emitSyncResult(input, plan, status);
  const txStarted = performance.now();
  await applyPlan(client, input, result);
  const transactionMs = performance.now() - txStarted;
  return {
    name,
    status: result.event.status,
    eventType: result.event.eventType,
    changedFields: plan.changedFields,
    edgesAdded: plan.edgesToAdd.length,
    edgesRemoved: plan.edgesToRemove.length,
    curatedEdgesPreserved: plan.curatedEdgesPreserved.length,
    reviewItems: plan.reviewItems.length,
    cacheTags: plan.affectedCacheTags,
    affectedRoutes: plan.affectedRoutes,
    searchRequests: plan.searchUpdateRequests,
    performance: {
      diffMs: Number(diffMs.toFixed(2)),
      transactionMs: Number(transactionMs.toFixed(2)),
      totalMs: Number((performance.now() - started).toFixed(2)),
    },
    result,
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "catalog-sync-pilot", "summary.json"), "sync:catalog-pilot");
    return;
  }

  const artifacts = await readPersistenceArtifacts();
  const [baseMovie, secondMovie] = artifacts.movies;
  const baseEdges = artifacts.edges.filter((edge) => edge.sourceId === baseMovie.id);
  const secondEdges = artifacts.edges.filter((edge) => edge.sourceId === secondMovie.id);
  const pool = createPool();
  const client = await pool.connect();
  const scenarios = [];
  const plans = [];
  const events = [];
  const relationDiffs = [];
  const cacheInvalidations = [];
  const routeRevalidations = [];
  const searchUpdateRequests = [];

  try {
    await client.query("BEGIN");

    const createdMovie = remapMovie(baseMovie, "mov_sync_pilot_create");
    const createdEdges = remapEdges(baseEdges, baseMovie.id, createdMovie.id);
    scenarios.push(await runScenario(client, "A. New Movie Create", makeInput(createdMovie, artifacts.entities, createdEdges, "CREATE")));

    const updatedMovie = {
      ...createdMovie,
      runtime: (createdMovie.runtime ?? 0) + 7,
      externalMetadata: {
        ...createdMovie.externalMetadata,
        runtime: (createdMovie.runtime ?? 0) + 7,
        overview: `${createdMovie.externalMetadata.overview} Sync metadata update.`,
        poster: { ...createdMovie.externalMetadata.poster, path: "/sync-pilot-poster.jpg" },
      },
      updatedAt: now(),
    };
    scenarios.push(await runScenario(client, "B. Metadata Update", makeInput(updatedMovie, artifacts.entities, createdEdges, "UPDATE")));

    const replacementDirector = secondEdges.find((edge) => edge.relationType === "MOVIE_DIRECTED_BY_PERSON");
    const originalDirector = createdEdges.find((edge) => edge.relationType === "MOVIE_DIRECTED_BY_PERSON");
    const firstCountry = createdEdges.find((edge) => edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY");
    const relationUpdateEdges = createdEdges
      .filter((edge) => edge.relationType !== "MOVIE_ACTED_BY_PERSON" && edgeKey(edge) !== edgeKey(originalDirector))
      .concat(replacementDirector ? [{ ...replacementDirector, id: edgeKey({ ...replacementDirector, sourceId: createdMovie.id }), sourceId: createdMovie.id }] : [])
      .concat(firstCountry ? [{ ...firstCountry, id: edgeKey({ ...firstCountry, targetId: "jp" }), targetId: "jp" }] : []);

    await client.query(
      `INSERT INTO knowledge_graph_edges (
        id, source_type, source_id, relation_type, target_type, target_id,
        provenance, confidence, is_curated, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10)
      ON CONFLICT DO NOTHING`,
      [
        `movie:${createdMovie.id}:MOVIE_PART_OF_MOVEMENT:movement:curated-sync-probe`,
        "movie",
        createdMovie.id,
        "MOVIE_PART_OF_MOVEMENT",
        "movement",
        "curated-sync-probe",
        JSON.stringify({ provider: "cinema-atlas-editorial", importedAt: now(), pipelineVersion: "catalog-sync-v1" }),
        "editorial-confirmed",
        now(),
        now(),
      ],
    );
    scenarios.push(await runScenario(client, "C. Relation Update", makeInput(updatedMovie, artifacts.entities, relationUpdateEdges, "REBUILD_RELATIONS")));
    scenarios.push(await runScenario(client, "D. No Change", makeInput(updatedMovie, artifacts.entities, relationUpdateEdges, "UPDATE")));

    const beforeFailure = await client.query("SELECT COUNT(*)::int AS count FROM catalog_movies");
    try {
      await client.query("SAVEPOINT sync_failure_probe");
      const failingMovie = remapMovie(baseMovie, "mov_sync_pilot_failure");
      await runScenario(client, "E. Failure Rollback", makeInput(failingMovie, artifacts.entities, createdEdges, "CREATE"));
      throw new Error("forced sync failure");
    } catch {
      await client.query("ROLLBACK TO SAVEPOINT sync_failure_probe");
      const afterFailure = await client.query("SELECT COUNT(*)::int AS count FROM catalog_movies");
      scenarios.push({
        name: "E. Failure Rollback Verification",
        status: beforeFailure.rows[0].count === afterFailure.rows[0].count ? "PASS" : "FAILED",
        eventType: "SYNC_FAILED",
        changedFields: [],
        edgesAdded: 0,
        edgesRemoved: 0,
        curatedEdgesPreserved: 0,
        reviewItems: 0,
        cacheTags: [],
        affectedRoutes: [],
        searchRequests: [],
        performance: { diffMs: 0, transactionMs: 0, totalMs: 0 },
      });
    }

    scenarios.push(
      await runScenario(
        client,
        "F. Review Required",
        makeInput(remapMovie(baseMovie, "mov_sync_pilot_review_required"), artifacts.entities, createdEdges, "CREATE", ["Unresolved Person: Example"]),
      ),
    );

    await client.query("ROLLBACK");

    for (const scenario of scenarios) {
      if (!scenario.result) continue;
      plans.push(scenario.result.plan);
      events.push(scenario.result.event);
      relationDiffs.push({
        scenario: scenario.name,
        added: scenario.result.plan.edgesToAdd.map(edgeKey),
        removed: scenario.result.plan.edgesToRemove.map(edgeKey),
        curatedPreserved: scenario.result.plan.curatedEdgesPreserved.map(edgeKey),
      });
      cacheInvalidations.push(...scenario.result.cacheInvalidations);
      routeRevalidations.push(...scenario.result.routeRevalidations);
      searchUpdateRequests.push(...scenario.result.searchUpdateRequests);
    }

    const summary = {
      command: "sync:catalog-pilot",
      status: scenarios.every((scenario) => scenario.status !== "FAILED") ? "PASS" : "WARNING",
      scenariosTested: scenarios.length,
      moviesCreated: scenarios.filter((scenario) => scenario.eventType === "MOVIE_CREATED").length,
      moviesUpdated: scenarios.filter((scenario) => scenario.eventType === "MOVIE_UPDATED").length,
      noChangeEvents: scenarios.filter((scenario) => scenario.eventType === "NO_CHANGE").length,
      edgesAdded: scenarios.reduce((sum, scenario) => sum + scenario.edgesAdded, 0),
      edgesRemoved: scenarios.reduce((sum, scenario) => sum + scenario.edgesRemoved, 0),
      curatedEdgesPreserved: scenarios.reduce((sum, scenario) => sum + scenario.curatedEdgesPreserved, 0),
      unresolvedBlocked: scenarios.some((scenario) => scenario.eventType === "REVIEW_REQUIRED"),
      rollbackPassed: scenarios.some((scenario) => scenario.name === "E. Failure Rollback Verification" && scenario.status === "PASS"),
      cacheTagsEmitted: new Set(cacheInvalidations.map((item) => item.tag)).size,
      routesAffected: new Set(routeRevalidations.map((item) => item.path)).size,
      searchUpdateRequestsEmitted: searchUpdateRequests.length,
      performanceMs: {
        totalSyncTime: Number(scenarios.reduce((sum, scenario) => sum + scenario.performance.totalMs, 0).toFixed(2)),
        diffCalculation: Number(scenarios.reduce((sum, scenario) => sum + scenario.performance.diffMs, 0).toFixed(2)),
        transactionExecution: Number(scenarios.reduce((sum, scenario) => sum + scenario.performance.transactionMs, 0).toFixed(2)),
      },
      completedAt: now(),
      scenarioResults: scenarios.map((scenario) => {
        const publicScenario = { ...scenario };
        delete publicScenario.result;
        return publicScenario;
      }),
    };

    await writeSyncArtifact("sync-plans.json", plans);
    await writeSyncArtifact("sync-events.json", events);
    await writeSyncArtifact("relation-diffs.json", relationDiffs);
    await writeSyncArtifact("cache-invalidations.json", cacheInvalidations);
    await writeSyncArtifact("route-revalidations.json", routeRevalidations);
    await writeSyncArtifact("search-update-requests.json", searchUpdateRequests);
    await writeSyncArtifact("summary.json", summary);
    console.table([summary]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

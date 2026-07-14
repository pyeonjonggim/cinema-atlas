import {
  createPool,
  hasDatabaseUrl,
  readPersistenceArtifacts,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

async function timed(label, fn) {
  const started = performance.now();
  const value = await fn();
  return {
    label,
    ms: Number((performance.now() - started).toFixed(2)),
    value,
  };
}

async function count(client, table) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return result.rows[0].count;
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact("verify-summary.json", "db:verify:catalog-pilot");
    return;
  }

  const { movies, entities, edges, summary: persistenceSummary } = await readPersistenceArtifacts();
  const pool = createPool();
  const client = await pool.connect();

  try {
    const firstMovie = movies[0];
    const directorEdge = edges.find(
      (edge) => edge.sourceId === firstMovie.id && edge.relationType === "MOVIE_DIRECTED_BY_PERSON",
    );
    const countryEdge = edges.find(
      (edge) => edge.sourceId === firstMovie.id && edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY",
    );
    const actorEdge = edges.find(
      (edge) => edge.sourceId === firstMovie.id && edge.relationType === "MOVIE_ACTED_BY_PERSON",
    );

    const measurements = [];
    measurements.push(
      await timed("getMovieById", () =>
        client.query("SELECT id, title FROM catalog_movies WHERE id = $1", [firstMovie.id]),
      ),
    );
    measurements.push(
      await timed("listMovies", () =>
        client.query("SELECT id, title FROM catalog_movies ORDER BY release_year NULLS LAST, title"),
      ),
    );
    measurements.push(
      await timed("getDirectorFilmography", () =>
        client.query(
          `SELECT source_id FROM knowledge_graph_edges
           WHERE relation_type = 'MOVIE_DIRECTED_BY_PERSON' AND target_id = $1`,
          [directorEdge?.targetId],
        ),
      ),
    );
    measurements.push(
      await timed("getCountryMovies", () =>
        client.query(
          `SELECT source_id FROM knowledge_graph_edges
           WHERE relation_type = 'MOVIE_PRODUCED_IN_COUNTRY' AND target_id = $1`,
          [countryEdge?.targetId],
        ),
      ),
    );
    measurements.push(
      await timed("getActorFilmography", () =>
        client.query(
          `SELECT source_id FROM knowledge_graph_edges
           WHERE relation_type = 'MOVIE_ACTED_BY_PERSON' AND target_id = $1`,
          [actorEdge?.targetId],
        ),
      ),
    );
    measurements.push(
      await timed("externalIdLookup", () =>
        client.query(
          `SELECT entity_id FROM catalog_external_ids
           WHERE entity_type = 'movie' AND provider = 'tmdb' AND external_value = $1`,
          [String(firstMovie.externalIds.tmdbId)],
        ),
      ),
    );

    const counts = {
      movies: await count(client, "catalog_movies"),
      people: await count(client, "catalog_people"),
      countries: await count(client, "catalog_countries"),
      genres: await count(client, "catalog_genres"),
      languages: await count(client, "catalog_languages"),
      companies: await count(client, "catalog_companies"),
      edges: await count(client, "knowledge_graph_edges"),
    };

    const duplicateEdges = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM (
        SELECT source_type, source_id, relation_type, target_type, target_id, COUNT(*)
        FROM knowledge_graph_edges
        GROUP BY source_type, source_id, relation_type, target_type, target_id
        HAVING COUNT(*) > 1
       ) duplicates`,
    );

    const expected = {
      movies: movies.length,
      people: entities.people.length,
      countries: entities.countries.length,
      genres: entities.genres.length,
      languages: entities.languages.length,
      companies: entities.companies.length,
      edges: edges.length,
    };

    const parity = Object.fromEntries(
      Object.entries(expected).map(([key, value]) => [key, counts[key] === value]),
    );

    const summary = {
      command: "db:verify:catalog-pilot",
      status: Object.values(parity).every(Boolean) && duplicateEdges.rows[0].count === 0 ? "PASS" : "WARNING",
      expected,
      actual: counts,
      parity,
      externalIdLookup: measurements.find((item) => item.label === "externalIdLookup")?.value.rowCount === 1,
      noDuplicateEdges: duplicateEdges.rows[0].count === 0,
      persistenceReimportDuplicateMovies: persistenceSummary.reimport.duplicateMoviesCreated,
      persistenceReimportDuplicateEdges: persistenceSummary.reimport.duplicateEdgesCreated,
      performanceMs: Object.fromEntries(measurements.map((item) => [item.label, item.ms])),
      completedAt: new Date().toISOString(),
    };
    await writePilotArtifact("verify-summary.json", summary);
    console.table([summary]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

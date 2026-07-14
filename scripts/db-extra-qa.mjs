import {
  createPool,
  readPersistenceArtifacts,
  writePilotArtifact,
} from "./lib/postgres-pilot-utils.mjs";

function relatedMovieIdsFromEdges(edges, movieId) {
  const movieEdges = edges.filter((edge) => edge.sourceType === "movie" && edge.sourceId === movieId);
  const related = new Set();

  for (const movieEdge of movieEdges) {
    edges
      .filter(
        (edge) =>
          edge.sourceType === "movie" &&
          edge.sourceId !== movieId &&
          edge.targetType === movieEdge.targetType &&
          edge.targetId === movieEdge.targetId,
      )
      .forEach((edge) => related.add(edge.sourceId));
  }

  return [...related].sort();
}

async function main() {
  const { movies, edges } = await readPersistenceArtifacts();
  const firstMovie = movies[0];
  const expectedRelatedMovieIds = relatedMovieIdsFromEdges(edges, firstMovie.id);
  const pool = createPool();
  const client = await pool.connect();
  let rollbackProbeRows = -1;

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO catalog_movies (
        id, title, external_metadata, approval_state, created_at, updated_at
      )
      VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW())`,
      ["rollback_probe", "Rollback Probe", "{}", "APPROVED"],
    );
    throw new Error("forced rollback probe");
  } catch {
    await client.query("ROLLBACK");
    const result = await client.query(
      "SELECT COUNT(*)::int AS count FROM catalog_movies WHERE id = $1",
      ["rollback_probe"],
    );
    rollbackProbeRows = result.rows[0].count;
  }

  const relatedResult = await client.query(
    `WITH first_edges AS (
      SELECT target_type, target_id
      FROM knowledge_graph_edges
      WHERE source_type = 'movie' AND source_id = $1
    )
    SELECT DISTINCT e.source_id
    FROM knowledge_graph_edges e
    INNER JOIN first_edges f
      ON f.target_type = e.target_type AND f.target_id = e.target_id
    WHERE e.source_type = 'movie' AND e.source_id <> $1
    ORDER BY e.source_id`,
    [firstMovie.id],
  );
  const postgresRelatedMovieIds = relatedResult.rows.map((row) => row.source_id).sort();

  client.release();
  await pool.end();

  const summary = {
    command: "db:extra-qa",
    status:
      rollbackProbeRows === 0 &&
      JSON.stringify(expectedRelatedMovieIds) === JSON.stringify(postgresRelatedMovieIds)
        ? "PASS"
        : "WARNING",
    transactionRollback: rollbackProbeRows === 0,
    rollbackProbeRows,
    relatedMovieParity:
      JSON.stringify(expectedRelatedMovieIds) === JSON.stringify(postgresRelatedMovieIds),
    expectedRelatedMovieCount: expectedRelatedMovieIds.length,
    postgresRelatedMovieCount: postgresRelatedMovieIds.length,
    poolEnded: true,
    completedAt: new Date().toISOString(),
  };

  await writePilotArtifact("extra-qa-summary.json", summary);
  console.table([summary]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

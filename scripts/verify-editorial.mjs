import {
  createPool,
  hasDatabaseUrl,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

async function count(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0].count;
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact("editorial-verify-summary.json", "verify:editorial");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const movementSlugs = ["korean-contemporary-cinema", "new-hollywood"];
    const awardSlugs = ["academy-best-picture", "venice-golden-lion"];
    const movementRows = await client.query("SELECT slug, name FROM catalog_movements WHERE slug = ANY($1) ORDER BY slug", [movementSlugs]);
    const awardRows = await client.query("SELECT slug, name FROM catalog_awards WHERE slug = ANY($1) ORDER BY slug", [awardSlugs]);
    const movementEdges = await count(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE source_type = 'movement' AND source_id = ANY($1)",
      [movementSlugs],
    );
    const awardEdges = await count(
      client,
      "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges WHERE source_type = 'award' AND source_id = ANY($1)",
      [awardSlugs],
    );
    const duplicateMovements = await count(
      client,
      "SELECT COUNT(*)::int AS count FROM (SELECT slug FROM catalog_movements GROUP BY slug HAVING COUNT(*) > 1) d",
    );
    const duplicateAwards = await count(
      client,
      "SELECT COUNT(*)::int AS count FROM (SELECT slug FROM catalog_awards GROUP BY slug HAVING COUNT(*) > 1) d",
    );

    const failures = [];
    if (movementRows.rows.length < movementSlugs.length) failures.push("Missing movement slug lookup");
    if (awardRows.rows.length < awardSlugs.length) failures.push("Missing award slug lookup");
    if (movementEdges < 1) failures.push("Missing movement relationships");
    if (awardEdges < 1) failures.push("Missing award relationships");
    if (duplicateMovements > 0) failures.push("Duplicate movement slugs found");
    if (duplicateAwards > 0) failures.push("Duplicate award slugs found");

    const summary = {
      command: "verify:editorial",
      status: failures.length === 0 ? "PASS" : "FAIL",
      movementRows: movementRows.rows,
      awardRows: awardRows.rows,
      movementEdges,
      awardEdges,
      duplicateMovements,
      duplicateAwards,
      failures,
      completedAt: new Date().toISOString(),
    };
    await writePilotArtifact("editorial-verify-summary.json", summary);
    console.table([summary]);
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

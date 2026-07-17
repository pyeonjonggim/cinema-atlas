import fs from "node:fs/promises";
import path from "node:path";
import {
  createPool,
  hasDatabaseUrl,
  repoRoot,
} from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "catalog-expansion-100");

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function count(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured. verify:catalog:100 requires a live PostgreSQL catalog.");
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const checks = {};
    checks.canonicalMovieCount = await count(client, "SELECT COUNT(*) AS count FROM catalog_movies");
    checks.personCount = await count(client, "SELECT COUNT(*) AS count FROM catalog_people");
    checks.countryCount = await count(client, "SELECT COUNT(*) AS count FROM catalog_countries");
    checks.edgeCount = await count(client, "SELECT COUNT(*) AS count FROM knowledge_graph_edges");

    const duplicateTmdbIds = await rows(
      client,
      `SELECT external_value, COUNT(*)::int AS count
       FROM catalog_external_ids
       WHERE entity_type = 'movie' AND provider = 'tmdb' AND external_key = 'tmdbId'
       GROUP BY external_value
       HAVING COUNT(*) > 1`,
    );
    const duplicatePersonTmdbIds = await rows(
      client,
      `SELECT external_value, COUNT(*)::int AS count
       FROM catalog_external_ids
       WHERE entity_type = 'person' AND provider = 'tmdb' AND external_key = 'tmdbId'
       GROUP BY external_value
       HAVING COUNT(*) > 1`,
    );
    const duplicateTitleYear = await rows(
      client,
      `SELECT LOWER(title) AS title, release_year, COUNT(*)::int AS count, ARRAY_AGG(id) AS ids
       FROM catalog_movies
       GROUP BY LOWER(title), release_year
       HAVING COUNT(*) > 1`,
    );
    const moviesWithoutDirector = await rows(
      client,
      `SELECT m.id, m.title, m.release_year
       FROM catalog_movies m
       WHERE NOT EXISTS (
         SELECT 1 FROM knowledge_graph_edges e
         WHERE e.source_type = 'movie'
           AND e.source_id = m.id
           AND e.relation_type = 'MOVIE_DIRECTED_BY_PERSON'
       )`,
    );
    const moviesWithoutCountry = await rows(
      client,
      `SELECT m.id, m.title, m.release_year
       FROM catalog_movies m
       WHERE NOT EXISTS (
         SELECT 1 FROM knowledge_graph_edges e
         WHERE e.source_type = 'movie'
           AND e.source_id = m.id
           AND e.relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
       )`,
    );
    const rawCountryDisplays = await rows(
      client,
      `SELECT DISTINCT c.id, c.iso_code, c.display_name
       FROM catalog_countries c
       JOIN knowledge_graph_edges e
        ON e.target_type = 'country' AND e.target_id = c.id
       WHERE e.relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
         AND (
          c.display_name IS NULL
          OR LENGTH(c.display_name) <= 2
          OR LOWER(c.display_name) = LOWER(c.iso_code)
         )`,
    );
    const brokenEdges = await rows(
      client,
      `SELECT e.id, e.source_type, e.source_id, e.relation_type, e.target_type, e.target_id
       FROM knowledge_graph_edges e
       WHERE
        (e.source_type = 'movie' AND NOT EXISTS (SELECT 1 FROM catalog_movies m WHERE m.id = e.source_id OR m.slug = e.source_id))
        OR (e.source_type = 'person' AND NOT EXISTS (
          SELECT 1 FROM catalog_people p
          WHERE p.id = e.source_id
            OR regexp_replace(lower(p.display_name), '[^a-z0-9]+', '-', 'g') = e.source_id
        ))
        OR (e.source_type = 'movement' AND NOT EXISTS (SELECT 1 FROM catalog_movements mo WHERE mo.slug = e.source_id OR mo.id = e.source_id))
        OR (e.source_type = 'award' AND NOT EXISTS (SELECT 1 FROM catalog_awards a WHERE a.slug = e.source_id OR a.id = e.source_id))
        OR (e.target_type = 'movie' AND NOT EXISTS (SELECT 1 FROM catalog_movies m WHERE m.id = e.target_id OR m.slug = e.target_id))
        OR (e.target_type = 'person' AND NOT EXISTS (
          SELECT 1 FROM catalog_people p
          WHERE p.id = e.target_id
            OR regexp_replace(lower(p.display_name), '[^a-z0-9]+', '-', 'g') = e.target_id
        ))
        OR (e.target_type = 'country' AND NOT EXISTS (
          SELECT 1 FROM catalog_countries c
          WHERE c.id = e.target_id
            OR regexp_replace(lower(c.display_name), '[^a-z0-9]+', '-', 'g') = e.target_id
            OR (e.target_id = 'korea' AND c.id = 'kr')
        ))
        OR (e.target_type = 'genre' AND NOT EXISTS (SELECT 1 FROM catalog_genres g WHERE g.id = e.target_id))
        OR (e.target_type = 'language' AND NOT EXISTS (SELECT 1 FROM catalog_languages l WHERE l.id = e.target_id))
        OR (e.target_type = 'company' AND NOT EXISTS (SELECT 1 FROM catalog_companies co WHERE co.id = e.target_id))
        OR (e.target_type = 'movement' AND NOT EXISTS (SELECT 1 FROM catalog_movements mo WHERE mo.slug = e.target_id OR mo.id = e.target_id))
        OR (e.target_type = 'award' AND NOT EXISTS (SELECT 1 FROM catalog_awards a WHERE a.slug = e.target_id OR a.id = e.target_id))`,
    );
    const invalidRoutes = await rows(
      client,
      `SELECT id, title, slug
       FROM catalog_movies
       WHERE COALESCE(NULLIF(slug, ''), NULLIF(id, '')) IS NULL`,
    );

    const searchSamples = await rows(
      client,
      `SELECT
        (SELECT COUNT(*)::int FROM catalog_movies WHERE LOWER(title) LIKE '%parasite%') AS parasite_movies,
        (SELECT COUNT(*)::int FROM catalog_people WHERE LOWER(display_name) LIKE '%bong%') AS bong_people,
        (SELECT COUNT(*)::int FROM catalog_countries WHERE LOWER(display_name) = 'south korea') AS south_korea,
        (SELECT COUNT(*)::int FROM catalog_movements WHERE LOWER(name) LIKE '%korean%') AS korean_movements,
        (SELECT COUNT(*)::int FROM catalog_awards WHERE LOWER(name) LIKE '%academy%') AS academy_awards`,
    );

    const issues = {
      duplicateTmdbIds,
      duplicatePersonTmdbIds,
      duplicateTitleYear,
      moviesWithoutDirector,
      moviesWithoutCountry,
      rawCountryDisplays,
      brokenEdges,
      invalidRoutes,
    };
    const pass =
      checks.canonicalMovieCount >= 100 &&
      Object.values(issues).every((items) => items.length === 0) &&
      Object.values(searchSamples[0]).every((value) => Number(value) > 0);

    const summary = {
      command: "verify:catalog:100",
      status: pass ? "PASS" : "FAIL",
      checks,
      searchSamples: searchSamples[0],
      issueCounts: Object.fromEntries(Object.entries(issues).map(([key, value]) => [key, value.length])),
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("verification-summary.json", summary);
    await writeArtifact("verification-issues.json", issues);
    console.table([summary]);

    if (!pass) {
      console.log(JSON.stringify(summary.issueCounts, null, 2));
      process.exitCode = 1;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

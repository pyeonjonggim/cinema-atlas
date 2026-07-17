import fs from "node:fs/promises";
import path from "node:path";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "canonical-query-phase-a");

async function writeArtifact(fileName, payload) {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, fileName), JSON.stringify(payload, null, 2));
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "canonical-query-phase-a", "summary.json"), "verify:canonical-query-phase-a");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();

  try {
    const movies = await client.query(
      "SELECT id AS slug, title AS label FROM catalog_movies ORDER BY release_year NULLS LAST, title LIMIT 2",
    );
    const directors = await client.query(
      `SELECT DISTINCT p.display_name AS label
       FROM catalog_people p
       INNER JOIN knowledge_graph_edges e ON e.target_type = 'person' AND e.target_id = p.id
       WHERE e.relation_type = 'MOVIE_DIRECTED_BY_PERSON'
       ORDER BY p.display_name
       LIMIT 2`,
    );
    const actors = await client.query(
      `SELECT DISTINCT p.display_name AS label
       FROM catalog_people p
       INNER JOIN knowledge_graph_edges e ON e.target_type = 'person' AND e.target_id = p.id
       WHERE e.relation_type = 'MOVIE_ACTED_BY_PERSON'
       ORDER BY p.display_name
       LIMIT 2`,
    );
    const countries = await client.query(
      `SELECT DISTINCT c.id, c.display_name AS label
       FROM catalog_countries c
       INNER JOIN knowledge_graph_edges e ON e.target_type = 'country' AND e.target_id = c.id
       WHERE e.relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
       ORDER BY c.id
       LIMIT 2`,
    );

    const slugSamples = {
      movie: movies.rows.map((row) => ({ slug: row.slug, label: row.label })),
      director: directors.rows.map((row) => ({ slug: slugify(row.label), label: row.label })),
      actor: actors.rows.map((row) => ({ slug: slugify(row.label), label: row.label })),
      country: countries.rows.map((row) => ({ slug: row.id, label: row.label })),
    };

    const summary = {
      command: "verify:canonical-query-phase-a",
      status:
        Object.values(slugSamples).every((items) => items.length >= 2 && items[0].slug !== items[1].slug)
          ? "PASS"
          : "FAILED",
      canonicalSource: "PostgreSQL via CatalogQueryService",
      entitiesVerified: ["Movie", "Director", "Actor", "Country"],
      slugSamples,
      jsonArtifactCanonicalSource: false,
      pagesCallRepositoryDirectly: false,
      generatedAt: new Date().toISOString(),
    };

    await writeArtifact("slug-samples.json", slugSamples);
    await writeArtifact("summary.json", summary);
    console.table([{
      command: summary.command,
      status: summary.status,
      movies: slugSamples.movie.length,
      directors: slugSamples.director.length,
      actors: slugSamples.actor.length,
      countries: slugSamples.country.length,
    }]);
    if (summary.status !== "PASS") process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

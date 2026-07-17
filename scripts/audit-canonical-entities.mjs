import fs from "node:fs/promises";
import path from "node:path";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "canonical-entity-audit");

async function writeArtifact(fileName, payload) {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, fileName), JSON.stringify(payload, null, 2));
}

async function count(client, table) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return result.rows[0].count;
}

async function sample(client, table, fields = "id") {
  const result = await client.query(`SELECT ${fields} FROM ${table} ORDER BY id LIMIT 5`);
  return result.rows;
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "canonical-entity-audit", "summary.json"), "audit:canonical-entities");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();

  try {
    const dbCoverage = {
      movie: {
        table: "catalog_movies",
        records: await count(client, "catalog_movies"),
        slugColumn: true,
        sample: await sample(client, "catalog_movies", "id, slug, title, release_year"),
      },
      director: {
        table: "catalog_people",
        records: await count(client, "catalog_people"),
        slugColumn: false,
        sample: await sample(client, "catalog_people", "id, display_name, roles"),
      },
      actor: {
        table: "catalog_people",
        records: await count(client, "catalog_people"),
        slugColumn: false,
        sample: await sample(client, "catalog_people", "id, display_name, roles"),
      },
      country: {
        table: "catalog_countries",
        records: await count(client, "catalog_countries"),
        slugColumn: false,
        sample: await sample(client, "catalog_countries", "id, iso_code, display_name"),
      },
      movement: {
        table: null,
        records: 0,
        slugColumn: false,
        sample: [],
        note: "No catalog_movements table in PostgreSQL v1 schema.",
      },
      award: {
        table: null,
        records: 0,
        slugColumn: false,
        sample: [],
        note: "No catalog_awards table in PostgreSQL v1 schema.",
      },
    };

    const relationRows = await client.query(
      `SELECT relation_type, target_type, COUNT(*)::int AS count
       FROM knowledge_graph_edges
       WHERE source_type = 'movie'
       GROUP BY relation_type, target_type
       ORDER BY relation_type, target_type`,
    );

    const routeMatrix = [
      { route: "/movies", entity: "Movie", source: "CatalogQueryService", dbBacked: "artifact/static fallback, not live DB" },
      { route: "/movies/[id]", entity: "Movie", source: "CatalogQueryService", dbBacked: "artifact/static fallback, not live DB" },
      { route: "/encyclopedia/directors", entity: "Director", source: "data/directors.ts + data/movies.ts", dbBacked: "no" },
      { route: "/encyclopedia/directors/[director]", entity: "Director", source: "data/directors.ts + CatalogQueryService movies", dbBacked: "partial" },
      { route: "/encyclopedia/actors", entity: "Actor", source: "data/movies.ts derived map", dbBacked: "no" },
      { route: "/encyclopedia/actors/[actor]", entity: "Actor", source: "data/actors.ts + data/movies.ts", dbBacked: "no" },
      { route: "/encyclopedia/countries", entity: "Country", source: "data/countries.ts + data/movies.ts", dbBacked: "no" },
      { route: "/encyclopedia/countries/[country]", entity: "Country", source: "canonicalEntityQuery + CatalogQueryService movies", dbBacked: "minimal live DB country lookup" },
      { route: "/encyclopedia/movements", entity: "Movement", source: "data/movies.ts derived map", dbBacked: "no" },
      { route: "/encyclopedia/movements/[movement]", entity: "Movement", source: "data/movements.ts + data/movies.ts", dbBacked: "no" },
      { route: "/encyclopedia/awards", entity: "Award", source: "data/awards.ts", dbBacked: "no" },
      { route: "/encyclopedia/awards/[award]", entity: "Award", source: "data/awards.ts + data/movies.ts", dbBacked: "no" },
    ];

    const repositoryMatrix = [
      { entity: "Movie", repository: "PostgresCatalogRepository", status: "implemented", notes: "list/get/upsert live Postgres methods exist, but UI CatalogQueryService still reads artifact." },
      { entity: "Director", repository: "PostgresCatalogRepository as person", status: "partial", notes: "Person table exists; Director projection repository does not exist." },
      { entity: "Actor", repository: "PostgresCatalogRepository as person", status: "partial", notes: "Person table exists; Actor projection repository does not exist." },
      { entity: "Country", repository: "PostgresCatalogRepository + canonicalEntityQuery", status: "partial", notes: "Live DB lookup added for country detail route." },
      { entity: "Movement", repository: "none", status: "missing", notes: "No Postgres table or repository." },
      { entity: "Award", repository: "none", status: "missing", notes: "No Postgres table or repository." },
    ];

    const queryLayerMatrix = [
      { entity: "Movie", queryLayer: "CatalogQueryService", pageUsesIt: true, dbBacked: false },
      { entity: "Director", queryLayer: "CatalogQueryService filmography only", pageUsesIt: "detail partial", dbBacked: false },
      { entity: "Actor", queryLayer: "CatalogQueryService actor filmography exists", pageUsesIt: false, dbBacked: false },
      { entity: "Country", queryLayer: "canonicalEntityQuery + CatalogQueryService movies", pageUsesIt: "detail only", dbBacked: "country detail lookup only" },
      { entity: "Movement", queryLayer: "none", pageUsesIt: false, dbBacked: false },
      { entity: "Award", queryLayer: "none", pageUsesIt: false, dbBacked: false },
    ];

    const syncCoverageMatrix = [
      { entity: "Movie", coverage: "stored", notes: "CatalogSyncService can upsert catalog_movies." },
      { entity: "Director", coverage: "stored as person + relationship", notes: "Director role saved in catalog_people and MOVIE_DIRECTED_BY_PERSON edges." },
      { entity: "Actor", coverage: "stored as person + relationship", notes: "Cast saved in catalog_people and MOVIE_ACTED_BY_PERSON edges." },
      { entity: "Country", coverage: "stored + relationship", notes: "catalog_countries and MOVIE_PRODUCED_IN_COUNTRY edges." },
      { entity: "Movement", coverage: "curated edge only in pilot", notes: "No automatic provider sync or table." },
      { entity: "Award", coverage: "not stored", notes: "No catalog_awards table and no automatic sync runner." },
    ];

    const summary = {
      command: "audit:canonical-entities",
      status: "PASS",
      canonicalEntities: ["Movie", "Director", "Actor", "Country", "Movement", "Award"],
      databaseCoverage: dbCoverage,
      relationCoverage: relationRows.rows,
      routeCount: routeMatrix.length,
      liveDbConnectedEntity: "Country detail route",
      generatedAt: new Date().toISOString(),
    };

    await writeArtifact("database-coverage.json", dbCoverage);
    await writeArtifact("relation-coverage.json", relationRows.rows);
    await writeArtifact("route-matrix.json", routeMatrix);
    await writeArtifact("repository-matrix.json", repositoryMatrix);
    await writeArtifact("query-layer-matrix.json", queryLayerMatrix);
    await writeArtifact("sync-coverage-matrix.json", syncCoverageMatrix);
    await writeArtifact("summary.json", summary);

    console.table([{ command: summary.command, status: summary.status, liveDbConnectedEntity: summary.liveDbConnectedEntity }]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

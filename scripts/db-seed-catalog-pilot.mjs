import {
  createPool,
  hasDatabaseUrl,
  readPersistenceArtifacts,
  upsertExternalIds,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

async function upsertMovie(client, movie) {
  await client.query(
    `INSERT INTO catalog_movies (
      id, slug, title, original_title, release_date, release_year, runtime,
      overview, original_language, poster_path, backdrop_path, external_metadata,
      approval_state, approval_reason, approved_at, approved_by, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
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
      movie.slug,
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
      movie.approval?.reason,
      movie.approval?.approvedAt,
      movie.approval?.approvedBy,
      movie.createdAt ?? new Date().toISOString(),
      movie.updatedAt ?? new Date().toISOString(),
    ],
  );
  await upsertExternalIds(client, "movie", movie.id, movie.externalIds);
}

async function upsertEntities(client, entities) {
  for (const person of entities.people) {
    await client.query(
      `INSERT INTO catalog_people (id, display_name, roles, provenance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        roles = EXCLUDED.roles,
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [person.id, person.name, JSON.stringify(person.roles ?? []), JSON.stringify(person.provenance ?? [])],
    );
    await upsertExternalIds(client, "person", person.id, person.externalIds);
  }

  for (const country of entities.countries) {
    await client.query(
      `INSERT INTO catalog_countries (id, iso_code, display_name, provenance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET
        iso_code = EXCLUDED.iso_code,
        display_name = EXCLUDED.display_name,
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [country.id, country.id.toUpperCase(), country.name ?? country.id.toUpperCase(), JSON.stringify(country.provenance ?? [])],
    );
    await upsertExternalIds(client, "country", country.id, country.externalIds);
  }

  for (const genre of entities.genres) {
    await client.query(
      `INSERT INTO catalog_genres (id, display_name, external_ids, provenance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        external_ids = EXCLUDED.external_ids,
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [genre.id, genre.name ?? genre.id, JSON.stringify(genre.externalIds ?? {}), JSON.stringify(genre.provenance ?? [])],
    );
    await upsertExternalIds(client, "genre", genre.id, genre.externalIds);
  }

  for (const language of entities.languages) {
    await client.query(
      `INSERT INTO catalog_languages (id, iso_code, display_name, external_ids, provenance)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
        iso_code = EXCLUDED.iso_code,
        display_name = EXCLUDED.display_name,
        external_ids = EXCLUDED.external_ids,
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [language.id, language.id, language.name ?? language.id, JSON.stringify(language.externalIds ?? {}), JSON.stringify(language.provenance ?? [])],
    );
    await upsertExternalIds(client, "language", language.id, language.externalIds);
  }

  for (const company of entities.companies) {
    await client.query(
      `INSERT INTO catalog_companies (id, display_name, external_ids, provenance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        external_ids = EXCLUDED.external_ids,
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [company.id, company.name ?? company.id, JSON.stringify(company.externalIds ?? {}), JSON.stringify(company.provenance ?? [])],
    );
    await upsertExternalIds(client, "company", company.id, company.externalIds);
  }
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
        edge.id,
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

async function countRows(client) {
  const tables = [
    "catalog_movies",
    "catalog_people",
    "catalog_countries",
    "catalog_genres",
    "catalog_languages",
    "catalog_companies",
    "knowledge_graph_edges",
  ];
  const counts = {};
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    counts[table] = result.rows[0].count;
  }
  return counts;
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact("seed-summary.json", "db:seed:catalog-pilot");
    return;
  }

  const { movies, entities, edges } = await readPersistenceArtifacts();
  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const movie of movies) {
      await upsertMovie(client, movie);
    }
    await upsertEntities(client, entities);
    await upsertEdges(client, edges);
    await client.query("COMMIT");

    const counts = await countRows(client);
    const summary = {
      command: "db:seed:catalog-pilot",
      status: "PASS",
      inputMovies: movies.length,
      inputEdges: edges.length,
      counts,
      completedAt: new Date().toISOString(),
    };
    await writePilotArtifact("seed-summary.json", summary);
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

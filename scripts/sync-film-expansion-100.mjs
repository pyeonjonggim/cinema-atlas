import crypto from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import Module from "node:module";
import path from "node:path";
import { performance } from "node:perf_hooks";
import ts from "typescript";
import {
  createPool,
  hasDatabaseUrl,
  repoRoot,
  upsertExternalIds,
} from "./lib/postgres-pilot-utils.mjs";

const requireFromScript = Module.createRequire(import.meta.url);
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(repoRoot, request.slice(2)), parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

requireFromScript.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const { createTmdbCatalogProviderFromEnv } = requireFromScript("../lib/catalog/providers/TmdbCatalogProvider.ts");
const { externalMovieToCanonicalDraft, validateCanonicalMovieDraft } = requireFromScript("../lib/catalogImport.ts");
const { CatalogSyncService } = requireFromScript("../lib/catalogSync.ts");

const artifactRoot = path.join(repoRoot, "data", "imports", "catalog-expansion-100");
const targetPath = path.join(repoRoot, "scripts", "fixtures", "film-expansion-100.json");
const editorialLinksPath = path.join(repoRoot, "scripts", "fixtures", "film-editorial-links.json");
const pipelineVersion = "catalog-expansion-100-v1";
const computedMovieRelationTypes = [
  "MOVIE_DIRECTED_BY_PERSON",
  "MOVIE_WRITTEN_BY_PERSON",
  "MOVIE_ACTED_BY_PERSON",
  "MOVIE_PRODUCED_IN_COUNTRY",
  "MOVIE_HAS_GENRE",
  "MOVIE_USES_LANGUAGE",
  "MOVIE_PRODUCED_BY_COMPANY",
];

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

function stableHash(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 12);
}

function stableEntityId(type, value) {
  return `${type}_${stableHash(value)}`;
}

function stableMovieId(draft) {
  if (draft.externalIds?.imdbId) return `mov_${stableHash(`imdb:${draft.externalIds.imdbId}`)}`;
  if (draft.externalIds?.wikidataId) return `mov_${stableHash(`wikidata:${draft.externalIds.wikidataId}`)}`;
  return `mov_${stableHash(`${draft.title}:${draft.year ?? "unknown"}`)}`;
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeCountryId(value) {
  return String(value ?? "").trim().toLowerCase();
}

function countryDisplayName(countryId) {
  const code = normalizeCountryId(countryId);
  const overrides = {
    gb: "United Kingdom",
    hk: "Hong Kong",
    ir: "Iran",
    kr: "South Korea",
    ru: "Russia",
    su: "Soviet Union",
    tw: "Taiwan",
    us: "United States",
    xc: "Czechoslovakia",
  };
  if (overrides[code]) return overrides[code];
  return code.length === 2 ? regionNames.of(code.toUpperCase()) ?? code.toUpperCase() : code.toUpperCase();
}

function languageDisplayName(languageId) {
  const code = String(languageId ?? "").trim().toLowerCase();
  if (!code) return "Unknown";
  return languageNames.of(code) ?? code.toUpperCase();
}

function tmdbExternalIds(externalIds = {}, fallbackTmdbId) {
  return {
    ...externalIds,
    tmdbId: externalIds.tmdbId ?? (fallbackTmdbId ? Number(fallbackTmdbId) : undefined),
  };
}

function createProvenance(providerRecordId) {
  return {
    provider: "tmdb",
    providerRecordId: String(providerRecordId),
    importedAt: new Date().toISOString(),
    pipelineVersion,
  };
}

function createEditorialProvenance() {
  return {
    provider: "cinema-atlas-editorial",
    importedAt: new Date().toISOString(),
    pipelineVersion,
  };
}

function edge(sourceType, sourceId, relationType, targetType, targetId, provenance, confidence, isCurated = false) {
  return {
    id: `${sourceType}:${sourceId}:${relationType}:${targetType}:${targetId}`,
    sourceType,
    sourceId,
    relationType,
    targetType,
    targetId,
    provenance,
    confidence,
    isCurated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function relationEntities(record, draft, movieId, target, editorialLink) {
  const providerRecordId = record.providerMovieId;
  const provenance = createProvenance(providerRecordId);
  const editorialProvenance = createEditorialProvenance();
  const people = new Map();
  const countries = new Map();
  const genres = new Map();
  const languages = new Map();
  const companies = new Map();
  const edges = [];

  for (const credit of record.credits ?? []) {
    if (!["director", "writer", "actor"].includes(credit.role)) continue;
    if (credit.role === "actor" && Number.isFinite(credit.billingOrder) && credit.billingOrder >= 10) continue;
    if (credit.role === "actor" && isNonPerformingActorCredit(credit)) continue;
    const personId = stableEntityId("person", credit.externalPersonId ?? credit.name);
    const existing = people.get(personId);
    const roles = unique([...(existing?.roles ?? []), credit.role]);
    people.set(personId, {
      id: personId,
      name: credit.name,
      originalName: credit.originalName,
      roles,
      profilePath: credit.profileImage?.path,
      externalIds: tmdbExternalIds(credit.externalIds, credit.externalPersonId),
      provenance: [provenance],
    });

    const relationType =
      credit.role === "director"
        ? "MOVIE_DIRECTED_BY_PERSON"
        : credit.role === "writer"
          ? "MOVIE_WRITTEN_BY_PERSON"
          : "MOVIE_ACTED_BY_PERSON";
    edges.push(edge("movie", movieId, relationType, "person", personId, provenance, "high"));
  }

  for (const countryId of draft.countryIds ?? []) {
    const id = normalizeCountryId(countryId);
    countries.set(id, { id, name: countryDisplayName(id), externalIds: {}, provenance: [provenance] });
    edges.push(edge("movie", movieId, "MOVIE_PRODUCED_IN_COUNTRY", "country", id, provenance, "high"));
  }

  for (const genreId of record.metadata.genreIds ?? []) {
    const id = stableEntityId("genre", genreId);
    genres.set(id, {
      id,
      name: record.metadata.genres?.find((genre) => genre.id === genreId)?.name ?? String(genreId),
      externalIds: Number.isFinite(Number(genreId)) ? { tmdbId: Number(genreId) } : {},
      provenance: [provenance],
    });
    edges.push(edge("movie", movieId, "MOVIE_HAS_GENRE", "genre", id, provenance, "high"));
  }

  for (const languageId of record.metadata.spokenLanguageIds ?? []) {
    const id = String(languageId).toLowerCase();
    languages.set(id, { id, name: languageDisplayName(id), externalIds: {}, provenance: [provenance] });
    edges.push(edge("movie", movieId, "MOVIE_USES_LANGUAGE", "language", id, provenance, "high"));
  }

  for (const companyId of record.metadata.productionCompanyIds ?? []) {
    const id = stableEntityId("company", companyId);
    const company = record.metadata.productionCompanies?.find((item) => item.id === companyId);
    companies.set(id, {
      id,
      name: company?.name ?? String(companyId),
      externalIds: Number.isFinite(Number(companyId)) ? { tmdbId: Number(companyId) } : {},
      provenance: [provenance],
    });
    edges.push(edge("movie", movieId, "MOVIE_PRODUCED_BY_COMPANY", "company", id, provenance, "high"));
  }

  for (const movementSlug of unique([...(target.movementSlugs ?? []), ...(editorialLink?.movementSlugs ?? [])])) {
    edges.push(edge("movie", movieId, "MOVIE_PART_OF_MOVEMENT", "movement", movementSlug, editorialProvenance, "editorial-confirmed", true));
  }

  for (const awardSlug of unique([...(target.awardSlugs ?? []), ...(editorialLink?.awardSlugs ?? [])])) {
    edges.push(edge("movie", movieId, "MOVIE_WON_AWARD", "award", awardSlug, editorialProvenance, "editorial-confirmed", true));
  }

  return {
    entities: {
      people: [...people.values()],
      countries: [...countries.values()],
      genres: [...genres.values()],
      languages: [...languages.values()],
      companies: [...companies.values()],
    },
    edges,
  };
}

function isNonPerformingActorCredit(credit) {
  const character = String(credit.character ?? "").toLowerCase();
  return (
    character.includes("archive footage") ||
    /\bself\b|himself|herself|themselves/.test(character) ||
    character.includes("interview") ||
    character.includes("narrator")
  );
}

async function writeArtifact(fileName, payload) {
  await fsPromises.mkdir(artifactRoot, { recursive: true });
  await fsPromises.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function currentCounts(client) {
  const queries = {
    canonicalMovies: "SELECT COUNT(*)::int AS count FROM catalog_movies",
    canonicalPersons: "SELECT COUNT(*)::int AS count FROM catalog_people",
    countries: "SELECT COUNT(*)::int AS count FROM catalog_countries",
    movements: "SELECT COUNT(*)::int AS count FROM catalog_movements",
    awards: "SELECT COUNT(*)::int AS count FROM catalog_awards",
    knowledgeGraphEdges: "SELECT COUNT(*)::int AS count FROM knowledge_graph_edges",
    tmdbMovies:
      "SELECT COUNT(DISTINCT entity_id)::int AS count FROM catalog_external_ids WHERE entity_type = 'movie' AND provider = 'tmdb'",
  };
  const counts = {};
  for (const [key, sql] of Object.entries(queries)) {
    const result = await client.query(sql);
    counts[key] = result.rows[0].count;
  }
  const roleCounts = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE roles ? 'director')::int AS directors,
      COUNT(*) FILTER (WHERE roles ? 'actor')::int AS actors
    FROM catalog_people
  `);
  counts.directors = roleCounts.rows[0].directors;
  counts.actors = roleCounts.rows[0].actors;
  return counts;
}

async function findExistingMovieId(client, draft) {
  const externalChecks = [
    ["tmdb", "tmdbId", draft.externalIds?.tmdbId],
    ["imdb", "imdbId", draft.externalIds?.imdbId],
    ["wikidata", "wikidataId", draft.externalIds?.wikidataId],
  ].filter(([, , value]) => Boolean(value));

  for (const [provider, externalKey, externalValue] of externalChecks) {
    const result = await client.query(
      `SELECT entity_id FROM catalog_external_ids
       WHERE entity_type = 'movie' AND provider = $1 AND external_key = $2 AND external_value = $3
       LIMIT 1`,
      [provider, externalKey, String(externalValue)],
    );
    if (result.rows[0]?.entity_id) return result.rows[0].entity_id;
  }

  return undefined;
}

async function uniqueMovieSlug(client, baseSlug, movieId, year) {
  let slug = baseSlug || movieId;
  const conflict = await client.query("SELECT id FROM catalog_movies WHERE slug = $1 AND id <> $2 LIMIT 1", [slug, movieId]);
  if (!conflict.rows[0]) return slug;
  slug = `${baseSlug}-${year ?? movieId.slice(-4)}`;
  return slug;
}

async function upsertMovie(client, movie) {
  await client.query(
    `INSERT INTO catalog_movies (
      id, slug, title, original_title, release_date, release_year, runtime,
      overview, original_language, poster_path, backdrop_path, external_metadata,
      approval_state, approval_reason, approved_at, approved_by, content_quality_score,
      created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
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
      content_quality_score = EXCLUDED.content_quality_score,
      updated_at = EXCLUDED.updated_at`,
    [
      movie.id,
      movie.slug,
      movie.title,
      movie.originalTitle,
      movie.releaseDate,
      movie.year,
      movie.runtime,
      movie.overview,
      movie.originalLanguage,
      movie.posterPath,
      movie.backdropPath,
      JSON.stringify(movie.externalMetadata ?? {}),
      "APPROVED",
      "Catalog expansion 100 batch sync",
      movie.approvedAt,
      "catalog-expansion-100",
      movie.contentQualityScore,
      movie.createdAt,
      movie.updatedAt,
    ],
  );
  await upsertExternalIds(client, "movie", movie.id, movie.externalIds);
}

async function upsertEntities(client, entities) {
  for (const person of entities.people) {
    await client.query(
      `INSERT INTO catalog_people (id, display_name, original_name, profile_path, roles, provenance)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        original_name = COALESCE(catalog_people.original_name, EXCLUDED.original_name),
        profile_path = COALESCE(EXCLUDED.profile_path, catalog_people.profile_path),
        roles = (
          SELECT jsonb_agg(DISTINCT value)
          FROM jsonb_array_elements(catalog_people.roles || EXCLUDED.roles) AS value
        ),
        provenance = EXCLUDED.provenance,
        updated_at = NOW()`,
      [person.id, person.name, person.originalName, person.profilePath, JSON.stringify(person.roles ?? []), JSON.stringify(person.provenance ?? [])],
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
      [country.id, country.id.toUpperCase(), country.name, JSON.stringify(country.provenance ?? [])],
    );
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
      [genre.id, genre.name, JSON.stringify(genre.externalIds ?? {}), JSON.stringify(genre.provenance ?? [])],
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
      [language.id, language.id, language.name, JSON.stringify(language.externalIds ?? {}), JSON.stringify(language.provenance ?? [])],
    );
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
      [company.id, company.name, JSON.stringify(company.externalIds ?? {}), JSON.stringify(company.provenance ?? [])],
    );
    await upsertExternalIds(client, "company", company.id, company.externalIds);
  }
}

async function replaceComputedEdges(client, movieId, edges) {
  await client.query(
    `DELETE FROM knowledge_graph_edges
     WHERE source_type = 'movie'
       AND source_id = $1
       AND is_curated = FALSE
       AND relation_type = ANY($2::text[])`,
    [movieId, computedMovieRelationTypes],
  );

  for (const item of edges) {
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
        item.id,
        item.sourceType,
        item.sourceId,
        item.relationType,
        item.targetType,
        item.targetId,
        JSON.stringify(item.provenance),
        item.confidence,
        item.isCurated,
        item.createdAt,
        item.updatedAt,
      ],
    );
  }
}

async function sourceMovieRecord(client, movieId) {
  const result = await client.query("SELECT * FROM catalog_movies WHERE id = $1", [movieId]);
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title,
    releaseDate: row.release_date,
    year: row.release_year,
    runtime: row.runtime,
    externalIds: {},
    externalMetadata: row.external_metadata ?? {},
    approval: { state: row.approval_state },
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

async function sourceEdges(client, movieId) {
  const result = await client.query("SELECT * FROM knowledge_graph_edges WHERE source_type = 'movie' AND source_id = $1", [movieId]);
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
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  }));
}

function buildMovie(record, draft, movieId, slug) {
  const metadata = record.metadata ?? {};
  const now = new Date().toISOString();
  return {
    id: movieId,
    slug,
    title: draft.title,
    originalTitle: draft.originalTitle,
    releaseDate: draft.releaseDate,
    year: draft.year,
    runtime: draft.runtime,
    overview: metadata.overview,
    originalLanguage: metadata.originalLanguageId ?? metadata.spokenLanguageIds?.[0],
    posterPath: metadata.poster?.path,
    backdropPath: metadata.backdrop?.path,
    externalMetadata: metadata,
    externalIds: tmdbExternalIds(draft.externalIds, record.providerMovieId),
    approvalState: "APPROVED",
    contentQualityScore: 90,
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function qualityWarnings(record, draft, edges) {
  const warnings = [];
  if (!draft.runtime) warnings.push("MISSING_RUNTIME");
  if (!record.metadata?.poster?.path) warnings.push("MISSING_POSTER");
  if (!record.metadata?.backdrop?.path) warnings.push("MISSING_BACKDROP");
  if (!edges.some((item) => item.relationType === "MOVIE_DIRECTED_BY_PERSON")) warnings.push("MISSING_DIRECTOR_EDGE");
  if (!edges.some((item) => item.relationType === "MOVIE_PRODUCED_IN_COUNTRY")) warnings.push("MISSING_COUNTRY_EDGE");
  return warnings;
}

function chooseBestSearchResult(results, expectedYear) {
  if (!results.length) return undefined;
  return results.find((result) => result.releaseYear === expectedYear)
    ?? results.find((result) => expectedYear && Math.abs((result.releaseYear ?? 0) - expectedYear) <= 1)
    ?? results[0];
}

async function resolveExternalMovie(provider, target) {
  if (target.tmdbId) {
    return provider.getMovieDetails(String(target.tmdbId));
  }
  const results = await provider.searchMovie({ query: target.title, year: target.year });
  const selected = chooseBestSearchResult(results, target.year);
  if (!selected) {
    const error = new Error("TMDB movie not found");
    error.stage = "TMDB_NOT_FOUND";
    throw error;
  }
  if (target.year && selected.releaseYear && Math.abs(selected.releaseYear - target.year) > 1) {
    const error = new Error(`Ambiguous year match: expected ${target.year}, got ${selected.releaseYear}`);
    error.stage = "AMBIGUOUS_MATCH";
    throw error;
  }
  return provider.getMovieDetails(selected.providerMovieId);
}

async function syncTarget(client, provider, syncService, target, editorialLinks) {
  const started = performance.now();
  const record = await resolveExternalMovie(provider, target);
  const draft = externalMovieToCanonicalDraft(record);
  const validationIssues = validateCanonicalMovieDraft(draft);
  const validationErrors = validationIssues.filter((issue) => issue.severity === "error");
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
    error.stage = "VALIDATION_FAILURE";
    throw error;
  }

  const existingId = await findExistingMovieId(client, draft);
  const movieId = existingId ?? stableMovieId(draft);
  const slug = await uniqueMovieSlug(client, slugify(draft.title), movieId, draft.year);
  const movie = buildMovie(record, draft, movieId, slug);
  const editorialKey = `${target.title}:${target.year ?? ""}`.toLowerCase();
  const editorialLink = editorialLinks.get(editorialKey);
  const { entities, edges } = relationEntities(record, draft, movieId, target, editorialLink);
  const warnings = [
    ...validationIssues.filter((issue) => issue.severity === "warning").map((issue) => issue.field.toUpperCase()),
    ...qualityWarnings(record, draft, edges),
  ];
  if (warnings.includes("MISSING_DIRECTOR_EDGE") || warnings.includes("MISSING_COUNTRY_EDGE")) {
    const error = new Error(`Required relationship missing: ${warnings.join(", ")}`);
    error.stage = "RELATION_VALIDATION_FAILURE";
    throw error;
  }

  const beforeMovie = await sourceMovieRecord(client, movieId);
  const beforeEdges = await sourceEdges(client, movieId);
  const syncInput = {
      canonicalMovie: {
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        originalTitle: movie.originalTitle,
        releaseDate: movie.releaseDate,
        year: movie.year,
        runtime: movie.runtime,
        externalIds: movie.externalIds,
        externalMetadata: movie.externalMetadata,
        approval: { state: "APPROVED", reason: "Catalog expansion 100 batch sync" },
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
      },
      approvalState: "APPROVED",
      resolvedEntities: entities,
      incomingEdges: edges,
      provenance: createProvenance(record.providerMovieId),
      qualityScore: movie.contentQualityScore,
      sourceVersion: pipelineVersion,
      requestedBy: "catalog-expansion-100",
      syncMode: beforeMovie ? "UPDATE" : "CREATE",
    };
  const plan = syncService.createSyncPlan(syncInput, beforeMovie, beforeEdges);

  await client.query("BEGIN");
  try {
    await upsertMovie(client, movie);
    await upsertEntities(client, entities);
    await replaceComputedEdges(client, movie.id, edges);
    await client.query(
      `INSERT INTO catalog_provenance (id, entity_type, entity_id, provider, provider_record_id, imported_at, pipeline_version, source_payload_hash, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
        imported_at = EXCLUDED.imported_at,
        pipeline_version = EXCLUDED.pipeline_version,
        source_payload_hash = EXCLUDED.source_payload_hash,
        metadata = EXCLUDED.metadata`,
      [
        `movie:${movie.id}:tmdb:${record.providerMovieId}`,
        "movie",
        movie.id,
        "tmdb",
        String(record.providerMovieId),
        new Date().toISOString(),
        pipelineVersion,
        stableHash(JSON.stringify(record.metadata ?? {})),
        JSON.stringify({ target, warnings }),
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    error.stage = error.stage ?? "DATABASE_FAILURE";
    throw error;
  }

  const result = syncService.emitSyncResult(syncInput, plan, "SUCCEEDED");

  return {
    title: movie.title,
    year: movie.year,
    tmdbId: movie.externalIds.tmdbId,
    movieId: movie.id,
    slug: movie.slug,
    status: beforeMovie ? "updated" : "created",
    warnings,
    entityCounts: Object.fromEntries(Object.entries(entities).map(([key, value]) => [key, value.length])),
    edgeCount: edges.length,
    syncEvent: result.event,
    durationMs: Math.round(performance.now() - started),
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured. This command must run against PostgreSQL and cannot be treated as skipped.");
  }
  if (!process.env.TMDB_API_KEY && !process.env.TMDB_ACCESS_TOKEN) {
    throw new Error("TMDB_API_KEY or TMDB_ACCESS_TOKEN is required for sync:films:100.");
  }

  const targets = JSON.parse(await fsPromises.readFile(targetPath, "utf8"));
  const editorialLinks = new Map(
    JSON.parse(await fsPromises.readFile(editorialLinksPath, "utf8")).map((item) => [
      `${item.title}:${item.year ?? ""}`.toLowerCase(),
      item,
    ]),
  );
  const provider = createTmdbCatalogProviderFromEnv();
  const syncService = new CatalogSyncService();
  const pool = createPool();
  const client = await pool.connect();
  const started = performance.now();
  const results = [];
  const failures = [];
  let beforeCounts;
  let afterCounts;

  try {
    beforeCounts = await currentCounts(client);
    console.log("Current catalog state:");
    console.table([beforeCounts]);

    for (const [index, target] of targets.entries()) {
      const label = `${target.title}${target.year ? ` (${target.year})` : ""}`;
      process.stdout.write(`[${index + 1}/${targets.length}] ${label} ... `);
      try {
        const result = await syncTarget(client, provider, syncService, target, editorialLinks);
        results.push(result);
        console.log(`${result.status} (${result.durationMs}ms)`);
      } catch (error) {
        const failure = {
          title: target.title,
          year: target.year,
          tmdbId: target.tmdbId,
          stage: error.stage ?? error.catalogError?.kind ?? "UNKNOWN_FAILURE",
          message: error.message,
        };
        failures.push(failure);
        console.log(`failed: ${failure.stage}`);
      }
    }

    afterCounts = await currentCounts(client);
  } finally {
    client.release();
    await pool.end();
  }

  const summary = {
    command: "sync:films:100",
    status: afterCounts.canonicalMovies >= 100 && failures.length === 0 ? "PASS" : "WARNING",
    targets: targets.length,
    created: results.filter((item) => item.status === "created").length,
    updated: results.filter((item) => item.status === "updated").length,
    failed: failures.length,
    beforeCounts,
    afterCounts,
    additionalMoviesNeededAtStart: Math.max(0, 100 - beforeCounts.canonicalMovies),
    totalDurationMs: Math.round(performance.now() - started),
    completedAt: new Date().toISOString(),
  };

  await writeArtifact("summary.json", summary);
  await writeArtifact("synced-movies.json", results);
  await writeArtifact("failures.json", failures);
  await writeArtifact("sync-events.json", results.map((item) => item.syncEvent));

  console.table([summary]);
  if (failures.length) {
    console.table(failures);
  }

  if (afterCounts.canonicalMovies < 100) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

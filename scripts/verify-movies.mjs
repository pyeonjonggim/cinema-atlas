import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "movie-integrity");
const currentYear = new Date().getFullYear();

function normalizeTitle(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlank(value) {
  return String(value ?? "").trim().length === 0;
}

function isMalformedImagePath(value) {
  if (isBlank(value)) return false;
  const pathValue = String(value).trim();
  return !pathValue.startsWith("/") && !/^https?:\/\//i.test(pathValue);
}

function hasSuspiciousEncoding(value) {
  const text = String(value ?? "");
  return /�|[A-Za-z]쨌[A-Za-z]/.test(text);
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] ??= [];
    groups[key].push(item);
    return groups;
  }, {});
}

function makeReview(movie, reasonCode, severity, field, detail) {
  return {
    movieId: movie.id,
    slug: movie.slug,
    title: movie.title,
    releaseYear: movie.release_year,
    reasonCode,
    severity,
    field,
    detail,
  };
}

async function loadMovies(client) {
  return rows(
    client,
    `SELECT
      id,
      slug,
      title,
      original_title,
      release_date,
      release_year,
      runtime,
      overview,
      original_language,
      poster_path,
      backdrop_path,
      external_metadata
    FROM catalog_movies
    ORDER BY release_year NULLS LAST, title`,
  );
}

async function loadMovieTmdbIds(client) {
  const externalRows = await rows(
    client,
    `SELECT entity_id, external_value
     FROM catalog_external_ids
     WHERE entity_type = 'movie'
       AND provider = 'tmdb'
       AND external_key = 'tmdbId'`,
  );

  return externalRows.reduce((map, row) => {
    map[row.entity_id] = row.external_value;
    return map;
  }, {});
}

async function loadRelationshipCoverage(client) {
  const edgeCounts = await rows(
    client,
    `SELECT source_id, relation_type, COUNT(*)::int AS count
     FROM knowledge_graph_edges
     WHERE source_type = 'movie'
     GROUP BY source_id, relation_type`,
  );

  return edgeCounts.reduce((map, row) => {
    map[row.source_id] ??= {};
    map[row.source_id][row.relation_type] = Number(row.count);
    return map;
  }, {});
}

async function loadDuplicateMovies(client) {
  const duplicateTmdbIds = await rows(
    client,
    `SELECT
       external_value AS tmdb_id,
       COUNT(*)::int AS count,
       ARRAY_AGG(entity_id ORDER BY entity_id) AS movie_ids
     FROM catalog_external_ids
     WHERE entity_type = 'movie'
       AND provider = 'tmdb'
       AND external_key = 'tmdbId'
     GROUP BY external_value
     HAVING COUNT(*) > 1`,
  );
  const duplicateSlugs = await rows(
    client,
    `SELECT
       slug,
       COUNT(*)::int AS count,
       ARRAY_AGG(id ORDER BY id) AS movie_ids,
       ARRAY_AGG(title ORDER BY title) AS titles
     FROM catalog_movies
     WHERE slug IS NOT NULL AND slug <> ''
     GROUP BY slug
     HAVING COUNT(*) > 1`,
  );
  const duplicateTitleYear = await rows(
    client,
    `SELECT
       LOWER(title) AS title_key,
       release_year,
       COUNT(*)::int AS count,
       ARRAY_AGG(id ORDER BY id) AS movie_ids,
       ARRAY_AGG(title ORDER BY title) AS titles
     FROM catalog_movies
     WHERE title IS NOT NULL AND title <> '' AND release_year IS NOT NULL
     GROUP BY LOWER(title), release_year
     HAVING COUNT(*) > 1`,
  );

  return { duplicateTmdbIds, duplicateSlugs, duplicateTitleYear };
}

function findSimilarTitleCandidates(movies) {
  return Object.values(
    groupBy(movies, (movie) => normalizeTitle(movie.original_title || movie.title)),
  )
    .filter((items) => items.length > 1 && normalizeTitle(items[0].original_title || items[0].title))
    .map((items) => ({
      normalizedTitle: normalizeTitle(items[0].original_title || items[0].title),
      candidates: items.map((movie) => ({
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        originalTitle: movie.original_title,
        releaseYear: movie.release_year,
      })),
    }));
}

async function loadRelationshipIssues(client) {
  const brokenEdges = await rows(
    client,
    `SELECT e.id, e.source_type, e.source_id, e.relation_type, e.target_type, e.target_id
     FROM knowledge_graph_edges e
     WHERE e.source_type = 'movie'
       AND (
        NOT EXISTS (SELECT 1 FROM catalog_movies m WHERE m.id = e.source_id OR m.slug = e.source_id)
        OR (e.target_type = 'movie' AND NOT EXISTS (SELECT 1 FROM catalog_movies m WHERE m.id = e.target_id OR m.slug = e.target_id))
        OR (e.target_type = 'person' AND NOT EXISTS (SELECT 1 FROM catalog_people p WHERE p.id = e.target_id))
        OR (e.target_type = 'country' AND NOT EXISTS (SELECT 1 FROM catalog_countries c WHERE c.id = e.target_id OR c.iso_code = e.target_id))
        OR (e.target_type = 'genre' AND NOT EXISTS (SELECT 1 FROM catalog_genres g WHERE g.id = e.target_id))
        OR (e.target_type = 'language' AND NOT EXISTS (SELECT 1 FROM catalog_languages l WHERE l.id = e.target_id))
        OR (e.target_type = 'company' AND NOT EXISTS (SELECT 1 FROM catalog_companies co WHERE co.id = e.target_id))
        OR (e.target_type = 'movement' AND NOT EXISTS (SELECT 1 FROM catalog_movements mo WHERE mo.id = e.target_id OR mo.slug = e.target_id))
        OR (e.target_type = 'award' AND NOT EXISTS (SELECT 1 FROM catalog_awards a WHERE a.id = e.target_id OR a.slug = e.target_id))
       )`,
  );
  const duplicateRelationships = await rows(
    client,
    `SELECT source_id, relation_type, target_type, target_id, COUNT(*)::int AS count
     FROM knowledge_graph_edges
     WHERE source_type = 'movie'
     GROUP BY source_id, relation_type, target_type, target_id
     HAVING COUNT(*) > 1`,
  );
  const orphanMovies = await rows(
    client,
    `SELECT m.id, m.slug, m.title, m.release_year
     FROM catalog_movies m
     WHERE NOT EXISTS (
       SELECT 1 FROM knowledge_graph_edges e
       WHERE e.source_type = 'movie'
         AND e.source_id = m.id
     )`,
  );

  return { brokenEdges, duplicateRelationships, orphanMovies };
}

function auditMetadata(movies, tmdbIds, relationshipCoverage) {
  const missingMedia = {
    missingPosters: [],
    missingBackdrops: [],
    malformedPosterPaths: [],
    malformedBackdropPaths: [],
  };
  const needsReview = [];
  const metadataIssues = {
    missingTitle: [],
    missingSlug: [],
    missingOriginalTitle: [],
    invalidReleaseYear: [],
    missingReleaseDate: [],
    invalidRuntime: [],
    missingOverview: [],
    shortOverview: [],
    suspiciousTextEncoding: [],
    missingTmdbId: [],
    missingDirectorRelation: [],
    missingActorRelation: [],
    missingCountryRelation: [],
    missingGenreRelation: [],
    missingMovementRelation: [],
  };

  for (const movie of movies) {
    const overview = String(movie.overview ?? "").trim();
    const edges = relationshipCoverage[movie.id] ?? {};

    if (isBlank(movie.title)) {
      metadataIssues.missingTitle.push(movie);
      needsReview.push(makeReview(movie, "MISSING_TITLE", "error", "title", "Movie title is required."));
    }
    if (
      hasSuspiciousEncoding(movie.title) ||
      hasSuspiciousEncoding(movie.original_title) ||
      hasSuspiciousEncoding(movie.overview)
    ) {
      metadataIssues.suspiciousTextEncoding.push(movie);
      needsReview.push(makeReview(movie, "SUSPICIOUS_TEXT_ENCODING", "warning", "title/originalTitle/overview", "Movie text contains replacement or mojibake-like characters."));
    }
    if (isBlank(movie.slug)) {
      metadataIssues.missingSlug.push(movie);
      needsReview.push(makeReview(movie, "MISSING_SLUG", "error", "slug", "Movie slug is required for canonical routing."));
    }
    if (isBlank(movie.original_title)) {
      metadataIssues.missingOriginalTitle.push(movie);
      needsReview.push(makeReview(movie, "MISSING_ORIGINAL_TITLE", "warning", "originalTitle", "Original title is absent."));
    }
    if (!movie.release_year || Number(movie.release_year) < 1888 || Number(movie.release_year) > currentYear + 2) {
      metadataIssues.invalidReleaseYear.push(movie);
      needsReview.push(makeReview(movie, "INVALID_RELEASE_YEAR", "error", "releaseYear", "Release year is missing or outside the expected film-history range."));
    }
    if (!movie.release_date) {
      metadataIssues.missingReleaseDate.push(movie);
      needsReview.push(makeReview(movie, "MISSING_RELEASE_DATE", "warning", "releaseDate", "Release date is absent."));
    }
    if (!movie.runtime || Number(movie.runtime) <= 0 || Number(movie.runtime) > 600) {
      metadataIssues.invalidRuntime.push(movie);
      needsReview.push(makeReview(movie, "INVALID_RUNTIME", "warning", "runtime", "Runtime is missing or outside expected bounds."));
    }
    if (!overview) {
      metadataIssues.missingOverview.push(movie);
      needsReview.push(makeReview(movie, "MISSING_OVERVIEW", "warning", "overview", "Overview is absent."));
    } else if (overview.length < 80) {
      metadataIssues.shortOverview.push(movie);
      needsReview.push(makeReview(movie, "SHORT_OVERVIEW", "warning", "overview", `Overview is ${overview.length} characters.`));
    }
    if (!tmdbIds[movie.id]) {
      metadataIssues.missingTmdbId.push(movie);
      needsReview.push(makeReview(movie, "MISSING_TMDB_ID", "error", "externalIds.tmdbId", "Movie is missing a TMDB source identity."));
    }
    if (isBlank(movie.poster_path)) {
      missingMedia.missingPosters.push(movie);
      needsReview.push(makeReview(movie, "MISSING_POSTER", "warning", "posterPath", "Poster image path is absent."));
    } else if (isMalformedImagePath(movie.poster_path)) {
      missingMedia.malformedPosterPaths.push(movie);
      needsReview.push(makeReview(movie, "MALFORMED_POSTER_PATH", "error", "posterPath", `Unexpected poster path: ${movie.poster_path}`));
    }
    if (isBlank(movie.backdrop_path)) {
      missingMedia.missingBackdrops.push(movie);
      needsReview.push(makeReview(movie, "MISSING_BACKDROP", "warning", "backdropPath", "Backdrop image path is absent."));
    } else if (isMalformedImagePath(movie.backdrop_path)) {
      missingMedia.malformedBackdropPaths.push(movie);
      needsReview.push(makeReview(movie, "MALFORMED_BACKDROP_PATH", "error", "backdropPath", `Unexpected backdrop path: ${movie.backdrop_path}`));
    }
    if (!edges.MOVIE_DIRECTED_BY_PERSON) {
      metadataIssues.missingDirectorRelation.push(movie);
      needsReview.push(makeReview(movie, "MISSING_DIRECTOR_RELATION", "error", "relationships.directors", "Movie has no director edge."));
    }
    if (!edges.MOVIE_ACTED_BY_PERSON) {
      metadataIssues.missingActorRelation.push(movie);
      needsReview.push(makeReview(movie, "MISSING_ACTOR_RELATION", "warning", "relationships.actors", "Movie has no actor edge."));
    }
    if (!edges.MOVIE_PRODUCED_IN_COUNTRY) {
      metadataIssues.missingCountryRelation.push(movie);
      needsReview.push(makeReview(movie, "MISSING_COUNTRY_RELATION", "error", "relationships.countries", "Movie has no production country edge."));
    }
    if (!edges.MOVIE_HAS_GENRE) {
      metadataIssues.missingGenreRelation.push(movie);
      needsReview.push(makeReview(movie, "MISSING_GENRE_RELATION", "warning", "relationships.genres", "Movie has no genre edge."));
    }
    if (!edges.MOVIE_PART_OF_MOVEMENT) {
      metadataIssues.missingMovementRelation.push(movie);
    }
  }

  return { missingMedia, needsReview, metadataIssues };
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:movies.");
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const movies = await loadMovies(client);
    const tmdbIds = await loadMovieTmdbIds(client);
    const relationshipCoverage = await loadRelationshipCoverage(client);
    const duplicateMovies = await loadDuplicateMovies(client);
    const relationshipIssues = await loadRelationshipIssues(client);

    const { missingMedia, needsReview, metadataIssues } = auditMetadata(movies, tmdbIds, relationshipCoverage);
    const similarTitleCandidates = findSimilarTitleCandidates(movies);
    const titleYearSimilarOnly = similarTitleCandidates.filter(
      (group) => new Set(group.candidates.map((movie) => movie.releaseYear)).size > 1,
    );

    const hardFailureCounts = {
      missingTitle: metadataIssues.missingTitle.length,
      missingSlug: metadataIssues.missingSlug.length,
      invalidReleaseYear: metadataIssues.invalidReleaseYear.length,
      missingTmdbId: metadataIssues.missingTmdbId.length,
      missingDirectorRelation: metadataIssues.missingDirectorRelation.length,
      missingCountryRelation: metadataIssues.missingCountryRelation.length,
      malformedPosterPaths: missingMedia.malformedPosterPaths.length,
      malformedBackdropPaths: missingMedia.malformedBackdropPaths.length,
      duplicateTmdbIds: duplicateMovies.duplicateTmdbIds.length,
      duplicateSlugs: duplicateMovies.duplicateSlugs.length,
      duplicateTitleYear: duplicateMovies.duplicateTitleYear.length,
      brokenEdges: relationshipIssues.brokenEdges.length,
      duplicateRelationships: relationshipIssues.duplicateRelationships.length,
      orphanMovies: relationshipIssues.orphanMovies.length,
    };
    const status = Object.values(hardFailureCounts).every((value) => value === 0) ? "PASS" : "FAIL";

    const movieSummary = {
      command: "verify:movies",
      status,
      movies: movies.length,
      sourceIdentities: {
        tmdbLinkedMovies: Object.keys(tmdbIds).length,
        missingTmdbIds: metadataIssues.missingTmdbId.length,
      },
      metadata: {
        missingOriginalTitle: metadataIssues.missingOriginalTitle.length,
        invalidReleaseYear: metadataIssues.invalidReleaseYear.length,
        missingReleaseDate: metadataIssues.missingReleaseDate.length,
        invalidRuntime: metadataIssues.invalidRuntime.length,
        missingOverview: metadataIssues.missingOverview.length,
        shortOverview: metadataIssues.shortOverview.length,
        suspiciousTextEncoding: metadataIssues.suspiciousTextEncoding.length,
      },
      media: {
        missingPosters: missingMedia.missingPosters.length,
        missingBackdrops: missingMedia.missingBackdrops.length,
        malformedPosterPaths: missingMedia.malformedPosterPaths.length,
        malformedBackdropPaths: missingMedia.malformedBackdropPaths.length,
      },
      relationships: {
        missingDirectorRelation: metadataIssues.missingDirectorRelation.length,
        missingActorRelation: metadataIssues.missingActorRelation.length,
        missingCountryRelation: metadataIssues.missingCountryRelation.length,
        missingGenreRelation: metadataIssues.missingGenreRelation.length,
        missingMovementRelation: metadataIssues.missingMovementRelation.length,
        brokenEdges: relationshipIssues.brokenEdges.length,
        duplicateRelationships: relationshipIssues.duplicateRelationships.length,
        orphanMovies: relationshipIssues.orphanMovies.length,
      },
      duplicates: {
        duplicateTmdbIds: duplicateMovies.duplicateTmdbIds.length,
        duplicateSlugs: duplicateMovies.duplicateSlugs.length,
        duplicateTitleYear: duplicateMovies.duplicateTitleYear.length,
        similarTitleCandidates: titleYearSimilarOnly.length,
      },
      needsReview: needsReview.length,
      hardFailureCounts,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("movie-summary.json", movieSummary);
    await writeArtifact("missing-media.json", missingMedia);
    await writeArtifact("duplicate-movies.json", {
      ...duplicateMovies,
      similarTitleCandidates: titleYearSimilarOnly,
    });
    await writeArtifact("relationship-issues.json", relationshipIssues);
    await writeArtifact("needs-review.json", needsReview);

    console.table([movieSummary]);
    if (status !== "PASS") {
      console.log(JSON.stringify(hardFailureCounts, null, 2));
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

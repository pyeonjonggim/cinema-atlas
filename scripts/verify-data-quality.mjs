import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "data-quality");
const overridesPath = path.join(repoRoot, "data", "catalog", "person-quality-overrides.json");
const personEditorialPath = path.join(repoRoot, "data", "editorial", "persons.json");

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function count(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function readOverrides() {
  return JSON.parse(await fs.readFile(overridesPath, "utf8"));
}

async function readPersonEditorial() {
  return JSON.parse(await fs.readFile(personEditorialPath, "utf8"));
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:data-quality.");
  }

  const overrides = await readOverrides();
  const personEditorial = await readPersonEditorial();
  const excludedActorNames = new Set(
    overrides.excludedActors.map((entry) => normalizeName(entry.name)),
  );
  const countryOverrideSlugs = new Set(
    personEditorial.persons
      .filter((entry) => entry.countrySlug && entry.status === "verified")
      .map((entry) => entry.slug),
  );

  const pool = createPool();
  const client = await pool.connect();
  try {
    const personRows = await rows(client, "SELECT id, display_name, roles, profile_path FROM catalog_people");
    const movieRows = await rows(client, "SELECT id, slug, title, release_year, poster_path, backdrop_path FROM catalog_movies");
    const countryRows = await rows(client, "SELECT id, iso_code, display_name FROM catalog_countries");

    const duplicatePersonSlugs = Object.values(
      personRows.reduce((groups, person) => {
        const slug = slugify(person.display_name);
        groups[slug] ??= [];
        groups[slug].push({ id: person.id, name: person.display_name, slug });
        return groups;
      }, {}),
    ).filter((items) => items.length > 1);
    const duplicateMovieSlugs = Object.values(
      movieRows.reduce((groups, movie) => {
        const slug = movie.slug || movie.id;
        groups[slug] ??= [];
        groups[slug].push({ id: movie.id, title: movie.title, slug });
        return groups;
      }, {}),
    ).filter((items) => items.length > 1);
    const emptySlugs = {
      people: personRows
        .map((person) => ({ id: person.id, name: person.display_name, slug: slugify(person.display_name) }))
        .filter((person) => !person.slug),
      movies: movieRows.filter((movie) => !(movie.slug || movie.id)),
    };

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
             OR (e.target_id = 'united-states' AND c.id = 'us')
             OR (e.target_id = 'japan' AND c.id = 'jp')
        ))
        OR (e.target_type = 'genre' AND NOT EXISTS (SELECT 1 FROM catalog_genres g WHERE g.id = e.target_id))
        OR (e.target_type = 'language' AND NOT EXISTS (SELECT 1 FROM catalog_languages l WHERE l.id = e.target_id))
        OR (e.target_type = 'company' AND NOT EXISTS (SELECT 1 FROM catalog_companies co WHERE co.id = e.target_id))
        OR (e.target_type = 'movement' AND NOT EXISTS (SELECT 1 FROM catalog_movements mo WHERE mo.slug = e.target_id OR mo.id = e.target_id))
        OR (e.target_type = 'award' AND NOT EXISTS (SELECT 1 FROM catalog_awards a WHERE a.slug = e.target_id OR a.id = e.target_id))`,
    );
    const duplicateEdges = await rows(
      client,
      `SELECT source_type, source_id, relation_type, target_type, target_id, COUNT(*)::int AS count
       FROM knowledge_graph_edges
       GROUP BY source_type, source_id, relation_type, target_type, target_id
       HAVING COUNT(*) > 1`,
    );
    const moviesWithoutDirector = await rows(
      client,
      `SELECT m.id, m.title
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
      `SELECT m.id, m.title
       FROM catalog_movies m
       WHERE NOT EXISTS (
        SELECT 1 FROM knowledge_graph_edges e
        WHERE e.source_type = 'movie'
          AND e.source_id = m.id
          AND e.relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
       )`,
    );
    const orphanPeople = await rows(
      client,
      `SELECT p.id, p.display_name, p.roles
       FROM catalog_people p
       WHERE NOT EXISTS (
        SELECT 1 FROM knowledge_graph_edges e
        WHERE (e.target_type = 'person' AND e.target_id = p.id)
           OR (e.source_type = 'person' AND e.source_id = p.id)
       )`,
    );

    const rawCountryDisplays = countryRows.filter(
      (country) =>
        !country.display_name ||
        country.display_name.length <= 2 ||
        String(country.display_name).toLowerCase() === String(country.iso_code ?? country.id).toLowerCase(),
    );
    const personCountryReview = await rows(
      client,
      `SELECT DISTINCT p.id, p.display_name, e.target_id AS movie_country_id, COUNT(*)::int AS count
       FROM catalog_people p
       JOIN knowledge_graph_edges role_edge
         ON role_edge.target_type = 'person'
        AND role_edge.target_id = p.id
        AND role_edge.relation_type = 'MOVIE_DIRECTED_BY_PERSON'
       JOIN knowledge_graph_edges e
         ON e.source_type = 'movie'
        AND e.source_id = role_edge.source_id
        AND e.relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
       GROUP BY p.id, p.display_name, e.target_id
       ORDER BY p.display_name, count DESC`,
    );
    const countryReviewGrouped = Object.values(
      personCountryReview.reduce((groups, row) => {
        groups[row.id] ??= {
          id: row.id,
          name: row.display_name,
          slug: slugify(row.display_name),
          inferredCountries: [],
          hasOverride: countryOverrideSlugs.has(slugify(row.display_name)),
        };
        groups[row.id].inferredCountries.push({
          countryId: row.movie_country_id,
          count: Number(row.count),
        });
        return groups;
      }, {}),
    ).filter((person) => person.inferredCountries.length > 1 || person.hasOverride);

    const excludedActorEdges = await rows(
      client,
      `SELECT DISTINCT p.id, p.display_name, e.source_id AS movie_id
       FROM catalog_people p
       JOIN knowledge_graph_edges e
         ON e.target_type = 'person'
        AND e.target_id = p.id
        AND e.relation_type = 'MOVIE_ACTED_BY_PERSON'`,
    ).then((items) =>
      items.filter((item) => excludedActorNames.has(normalizeName(item.display_name))),
    );

    const mediaCoverage = {
      moviesWithPoster: await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NOT NULL AND poster_path <> ''"),
      moviesWithoutPoster: await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NULL OR poster_path = ''"),
      personsWithProfile: await count(client, "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NOT NULL AND profile_path <> ''"),
      personsWithoutProfile: await count(client, "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NULL OR profile_path = ''"),
      malformedPosterPaths: await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NOT NULL AND poster_path <> '' AND poster_path NOT LIKE '/%'"),
      malformedProfilePaths: await count(client, "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NOT NULL AND profile_path <> '' AND profile_path NOT LIKE '/%'"),
    };

    const projectionIssues = {
      duplicatePersonSlugs,
      duplicateMovieSlugs,
      emptySlugs,
    };
    const graphIssues = {
      brokenEdges,
      duplicateEdges,
      moviesWithoutDirector,
      moviesWithoutCountry,
      orphanPeople,
    };
    const countryIssues = {
      rawCountryDisplays,
      reviewCandidates: countryReviewGrouped,
    };
    const eligibilityIssues = {
      excludedActorEdges,
    };
    const pass =
      duplicatePersonSlugs.length === 0 &&
      duplicateMovieSlugs.length === 0 &&
      emptySlugs.people.length === 0 &&
      emptySlugs.movies.length === 0 &&
      brokenEdges.length === 0 &&
      duplicateEdges.length === 0 &&
      moviesWithoutDirector.length === 0 &&
      moviesWithoutCountry.length === 0 &&
      rawCountryDisplays.length === 0 &&
      mediaCoverage.malformedPosterPaths === 0 &&
      mediaCoverage.malformedProfilePaths === 0;

    const summary = {
      command: "verify:data-quality",
      status: pass ? "PASS" : "FAIL",
      counts: {
        movies: movieRows.length,
        persons: personRows.length,
        countries: countryRows.length,
      },
      slugIssues: {
        duplicatePersonSlugs: duplicatePersonSlugs.length,
        duplicateMovieSlugs: duplicateMovieSlugs.length,
        emptyPersonSlugs: emptySlugs.people.length,
        emptyMovieSlugs: emptySlugs.movies.length,
      },
      graphIssues: {
        brokenEdges: brokenEdges.length,
        duplicateEdges: duplicateEdges.length,
        moviesWithoutDirector: moviesWithoutDirector.length,
        moviesWithoutCountry: moviesWithoutCountry.length,
        orphanPeople: orphanPeople.length,
      },
      countryIssues: {
        rawCountryDisplays: rawCountryDisplays.length,
        reviewCandidates: countryReviewGrouped.length,
      },
      eligibility: {
        excludedActorEdges: excludedActorEdges.length,
      },
      mediaCoverage,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("summary.json", summary);
    await writeArtifact("projection-issues.json", projectionIssues);
    await writeArtifact("graph-issues.json", graphIssues);
    await writeArtifact("country-issues.json", countryIssues);
    await writeArtifact("eligibility-issues.json", eligibilityIssues);
    await writeArtifact("media-coverage.json", mediaCoverage);
    console.table([summary]);

    if (!pass) {
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

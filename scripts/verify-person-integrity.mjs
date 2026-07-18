import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "person-integrity");
const overridesPath = path.join(repoRoot, "data", "catalog", "person-quality-overrides.json");

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

async function readOverrides() {
  return JSON.parse(await fs.readFile(overridesPath, "utf8"));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

function duplicateSlugs(people) {
  const bySlug = new Map();
  for (const person of people) {
    const slug = slugify(person.display_name);
    const entries = bySlug.get(slug) ?? [];
    entries.push({
      id: person.id,
      name: person.display_name,
      slug,
    });
    bySlug.set(slug, entries);
  }
  return [...bySlug.values()].filter((entries) => entries.length > 1);
}

function missingSlugs(people) {
  return people
    .map((person) => ({
      id: person.id,
      name: person.display_name,
      slug: slugify(person.display_name),
    }))
    .filter((person) => !person.slug);
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:persons.");
  }

  const overrides = await readOverrides();
  const excludedActorNames = new Set(
    overrides.excludedActors.map((entry) => normalizeName(entry.name)),
  );

  const pool = createPool();
  const client = await pool.connect();
  try {
    const directors = await rows(
      client,
      `SELECT DISTINCT p.id, p.display_name, p.roles, p.profile_path
       FROM catalog_people p
       INNER JOIN knowledge_graph_edges e
         ON e.target_type = 'person'
        AND e.target_id = p.id
       WHERE e.source_type = 'movie'
         AND e.relation_type = 'MOVIE_DIRECTED_BY_PERSON'
       ORDER BY p.display_name`,
    );
    const rawActors = await rows(
      client,
      `SELECT DISTINCT p.id, p.display_name, p.roles, p.profile_path
       FROM catalog_people p
       INNER JOIN knowledge_graph_edges e
         ON e.target_type = 'person'
        AND e.target_id = p.id
       WHERE e.source_type = 'movie'
         AND e.relation_type = 'MOVIE_ACTED_BY_PERSON'
       ORDER BY p.display_name`,
    );
    const actors = rawActors.filter(
      (person) => !excludedActorNames.has(normalizeName(person.display_name)),
    );
    const excludedActorsPresent = rawActors.filter((person) =>
      excludedActorNames.has(normalizeName(person.display_name)),
    );

    const directorDuplicateSlugs = duplicateSlugs(directors);
    const actorDuplicateSlugs = duplicateSlugs(actors);
    const directorMissingSlugs = missingSlugs(directors);
    const actorMissingSlugs = missingSlugs(actors);
    const directorsWithoutEdges = await rows(
      client,
      `SELECT p.id, p.display_name
       FROM catalog_people p
       WHERE p.roles ? 'director'
         AND NOT EXISTS (
          SELECT 1 FROM knowledge_graph_edges e
          WHERE e.target_type = 'person'
            AND e.target_id = p.id
            AND e.relation_type = 'MOVIE_DIRECTED_BY_PERSON'
        )`,
    );
    const actorsWithoutEdges = await rows(
      client,
      `SELECT p.id, p.display_name
       FROM catalog_people p
       WHERE p.roles ? 'actor'
         AND NOT EXISTS (
          SELECT 1 FROM knowledge_graph_edges e
          WHERE e.target_type = 'person'
            AND e.target_id = p.id
            AND e.relation_type = 'MOVIE_ACTED_BY_PERSON'
        )`,
    );
    const routeMismatch = [...directors, ...actors]
      .map((person) => ({
        id: person.id,
        name: person.display_name,
        slug: slugify(person.display_name),
      }))
      .filter((person) => !person.slug || person.slug.includes("--"));

    const issues = {
      directorDuplicateSlugs,
      actorDuplicateSlugs,
      directorMissingSlugs,
      actorMissingSlugs,
      directorsWithoutEdges,
      actorsWithoutEdges,
      routeMismatch,
    };
    const summary = {
      command: "verify:persons",
      status: Object.values(issues).every((items) => items.length === 0) ? "PASS" : "FAIL",
      personRouteSummary: {
        directorsExpected: directors.length,
        directorsResolvable: directors.length - directorMissingSlugs.length,
        directorsMissing: directorMissingSlugs.length,
        actorsRaw: rawActors.length,
        actorsExpected: actors.length,
        actorsResolvable: actors.length - actorMissingSlugs.length,
        actorsMissing: actorMissingSlugs.length,
        actorsExcludedByEligibility: excludedActorsPresent.length,
      },
      eligibility: {
        excludedActors: excludedActorsPresent.map((person) => ({
          id: person.id,
          name: person.display_name,
          reason:
            overrides.excludedActors.find(
              (entry) => normalizeName(entry.name) === normalizeName(person.display_name),
            )?.reason ?? "EXCLUDED",
        })),
      },
      issueCounts: Object.fromEntries(
        Object.entries(issues).map(([key, value]) => [key, value.length]),
      ),
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("summary.json", summary);
    await writeArtifact("issues.json", issues);
    await writeArtifact("published-directors.json", directors);
    await writeArtifact("published-actors.json", actors);
    await writeArtifact("excluded-actors.json", summary.eligibility.excludedActors);
    console.table([summary]);

    if (summary.status !== "PASS") {
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

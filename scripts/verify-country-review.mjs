import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "country-review");
const personEditorialPath = path.join(repoRoot, "data", "editorial", "persons.json");

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:country-review.");
  }

  const editorial = JSON.parse(await fs.readFile(personEditorialPath, "utf8"));
  const editorialBySlug = new Map(editorial.persons.map((entry) => [entry.slug, entry]));

  const pool = createPool();
  const client = await pool.connect();
  try {
    const inferredRows = await rows(
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
    const candidates = Object.values(
      inferredRows.reduce((groups, row) => {
        const slug = slugify(row.display_name);
        groups[row.id] ??= {
          id: row.id,
          name: row.display_name,
          slug,
          inferredCountries: [],
        };
        groups[row.id].inferredCountries.push({
          countryId: row.movie_country_id,
          count: Number(row.count),
        });
        return groups;
      }, {}),
    ).filter((person) => person.inferredCountries.length > 1);

    const verified = candidates
      .filter((candidate) => editorialBySlug.get(candidate.slug)?.status === "verified")
      .map((candidate) => ({
        ...candidate,
        editorialCountrySlug: editorialBySlug.get(candidate.slug)?.countrySlug,
        status: editorialBySlug.get(candidate.slug)?.status,
      }));
    const review = candidates
      .filter((candidate) => editorialBySlug.get(candidate.slug)?.status === "review")
      .map((candidate) => ({
        ...candidate,
        editorialCountrySlug: editorialBySlug.get(candidate.slug)?.countrySlug,
        status: editorialBySlug.get(candidate.slug)?.status,
      }));
    const unknown = candidates.filter((candidate) => !editorialBySlug.has(candidate.slug));
    const summary = {
      command: "verify:country-review",
      status: "PASS",
      candidates: candidates.length,
      verified: verified.length,
      review: review.length,
      unknown: unknown.length,
      remaining: review.length + unknown.length,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("summary.json", summary);
    await writeArtifact("verified.json", verified);
    await writeArtifact("review.json", review);
    await writeArtifact("unknown.json", unknown);
    console.table([summary]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

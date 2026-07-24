import {
  createPool,
  hasDatabaseUrl,
  repoRoot,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const personEditorialPath = path.join(repoRoot, "data", "editorial", "persons.json");
const qualityPath = path.join(repoRoot, "data", "catalog", "person-quality-overrides.json");

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
    const [personEditorial, quality] = await Promise.all([
      fs.readFile(personEditorialPath, "utf8").then(JSON.parse),
      fs.readFile(qualityPath, "utf8").then(JSON.parse),
    ]);
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
    const personEntries = personEditorial.persons ?? [];
    const personSlugs = personEntries.map((entry) => entry.slug);
    const duplicatePersonEditorialSlugs = Object.values(
      personSlugs.reduce((groups, slug) => {
        groups[slug] ??= 0;
        groups[slug] += 1;
        return groups;
      }, {}),
    ).filter((count) => count > 1).length;
    const unknownPersonSlugs = [];
    const invalidCountrySlugs = [];
    const people = await client.query("SELECT id, display_name FROM catalog_people");
    const knownPersonSlugs = new Set(
      people.rows.flatMap((person) => [
        String(person.id),
        slugify(person.display_name),
      ]),
    );
    const knownCountrySlugs = new Set([
      "argentina",
      "belgium",
      "brazil",
      "china",
      "france",
      "germany",
      "hong-kong",
      "iran",
      "italy",
      "japan",
      "korea",
      "mexico",
      "sweden",
      "taiwan",
      "united-kingdom",
      "united-states",
    ]);

    for (const entry of personEntries) {
      const slugs = [entry.slug, ...(entry.aliases ?? [])];
      if (!slugs.some((slug) => knownPersonSlugs.has(slug))) unknownPersonSlugs.push(entry.slug);
      if (entry.countrySlug && !knownCountrySlugs.has(entry.countrySlug)) {
        invalidCountrySlugs.push({
          slug: entry.slug,
          countrySlug: entry.countrySlug,
        });
      }
    }

    const hiddenConflicts = personEntries.filter((entry) =>
      quality.excludedActors.some(
        (excluded) => slugify(excluded.name) === entry.slug || normalizeName(excluded.name) === normalizeName(entry.slug),
      ) && entry.hidden !== true,
    );

    const failures = [];
    if (movementRows.rows.length < movementSlugs.length) failures.push("Missing movement slug lookup");
    if (awardRows.rows.length < awardSlugs.length) failures.push("Missing award slug lookup");
    if (movementEdges < 1) failures.push("Missing movement relationships");
    if (awardEdges < 1) failures.push("Missing award relationships");
    if (duplicateMovements > 0) failures.push("Duplicate movement slugs found");
    if (duplicateAwards > 0) failures.push("Duplicate award slugs found");
    if (duplicatePersonEditorialSlugs > 0) failures.push("Duplicate person editorial slugs found");
    if (unknownPersonSlugs.length > 0) failures.push("Unknown person editorial slugs found");
    if (invalidCountrySlugs.length > 0) failures.push("Invalid person editorial country slugs found");
    if (hiddenConflicts.length > 0) failures.push("Person quality hidden conflicts found");

    const summary = {
      command: "verify:editorial",
      status: failures.length === 0 ? "PASS" : "FAIL",
      movementRows: movementRows.rows,
      awardRows: awardRows.rows,
      movementEdges,
      awardEdges,
      duplicateMovements,
      duplicateAwards,
      personEditorial: {
        entries: personEntries.length,
        verified: personEntries.filter((entry) => entry.status === "verified").length,
        review: personEntries.filter((entry) => entry.status === "review").length,
        hidden: personEntries.filter((entry) => entry.hidden === true).length,
        duplicatePersonEditorialSlugs,
        unknownPersonSlugs,
        invalidCountrySlugs,
        hiddenConflicts,
      },
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

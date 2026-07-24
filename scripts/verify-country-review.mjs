import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "country-review");
const personEditorialPath = path.join(repoRoot, "data", "editorial", "persons.json");
const allowedStates = new Set(["VERIFIED", "REVIEW", "UNKNOWN", "NOT_APPLICABLE"]);

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeState(value) {
  const state = String(value ?? "").trim().toUpperCase().replace(/-/g, "_");
  return allowedStates.has(state) ? state : "";
}

function summarize(records) {
  return {
    count: records.length,
    records,
  };
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function rows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

function buildEditorialIndexes(entries) {
  const bySlug = new Map();
  const duplicateEditorialEntries = [];

  for (const entry of entries) {
    const slug = entry.slug;
    if (!slug) continue;
    if (bySlug.has(slug)) {
      duplicateEditorialEntries.push({
        slug,
        entries: [bySlug.get(slug), entry],
      });
    }
    bySlug.set(slug, entry);
  }

  return { bySlug, duplicateEditorialEntries };
}

async function loadCountrySlugSet(client) {
  const countries = await rows(client, "SELECT id, iso_code, display_name FROM catalog_countries");
  const countrySlugs = new Set([
    "korea",
    "south-korea",
    "united-states",
    "united-kingdom",
    "hong-kong",
  ]);

  for (const country of countries) {
    if (country.id) countrySlugs.add(String(country.id).toLowerCase());
    if (country.iso_code) countrySlugs.add(String(country.iso_code).toLowerCase());
    if (country.display_name) countrySlugs.add(slugify(country.display_name));
  }

  return countrySlugs;
}

async function loadKnownPersonSlugs(client) {
  const people = await rows(client, "SELECT id, display_name FROM catalog_people");
  return new Set(
    people.flatMap((person) => [
      String(person.id),
      slugify(person.display_name),
    ]),
  );
}

async function loadCandidates(client) {
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

  return Object.values(
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
}

function decorateCandidate(candidate, editorialEntry) {
  const state = normalizeState(editorialEntry?.status) || "MISSING";
  return {
    ...candidate,
    editorial: editorialEntry
      ? {
          slug: editorialEntry.slug,
          preferredName: editorialEntry.preferredName,
          countrySlug: editorialEntry.countrySlug,
          status: state,
          hidden: editorialEntry.hidden === true,
          reason: editorialEntry.reason,
        }
      : undefined,
    status: state,
  };
}

function validateEditorialEntries(entries, countrySlugs, knownPersonSlugs) {
  const invalidCountrySlugs = [];
  const brokenCountryReferences = [];
  const hiddenPersonConsistency = [];
  const unknownEditorialSlugs = [];
  const invalidStates = [];

  for (const entry of entries) {
    const state = normalizeState(entry.status);
    const allPersonSlugs = [entry.slug, ...(entry.aliases ?? [])].filter(Boolean);
    const matchesPerson = allPersonSlugs.some((slug) => knownPersonSlugs.has(slug));

    if (!state) {
      invalidStates.push({
        slug: entry.slug,
        status: entry.status,
      });
    }
    if (!matchesPerson) {
      unknownEditorialSlugs.push({
        slug: entry.slug,
        aliases: entry.aliases ?? [],
      });
    }
    if (entry.countrySlug && !countrySlugs.has(entry.countrySlug)) {
      invalidCountrySlugs.push({
        slug: entry.slug,
        countrySlug: entry.countrySlug,
      });
      brokenCountryReferences.push({
        slug: entry.slug,
        countrySlug: entry.countrySlug,
        reason: "Country slug does not resolve to catalog_countries or an approved legacy country slug.",
      });
    }
    if (entry.hidden === true && entry.countrySlug) {
      hiddenPersonConsistency.push({
        slug: entry.slug,
        countrySlug: entry.countrySlug,
        reason: "Hidden persons should not carry a published country assignment.",
      });
    }
  }

  return {
    invalidStates,
    invalidCountrySlugs,
    brokenCountryReferences,
    hiddenPersonConsistency,
    unknownEditorialSlugs,
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:country-review.");
  }

  const editorial = JSON.parse(await fs.readFile(personEditorialPath, "utf8"));
  const personEntries = editorial.persons ?? [];
  const { bySlug: editorialBySlug, duplicateEditorialEntries } = buildEditorialIndexes(personEntries);

  const pool = createPool();
  const client = await pool.connect();
  try {
    const countrySlugs = await loadCountrySlugSet(client);
    const knownPersonSlugs = await loadKnownPersonSlugs(client);
    const candidates = await loadCandidates(client);
    const validation = validateEditorialEntries(personEntries, countrySlugs, knownPersonSlugs);

    const decoratedCandidates = candidates.map((candidate) =>
      decorateCandidate(candidate, editorialBySlug.get(candidate.slug)),
    );
    const verified = decoratedCandidates.filter((candidate) => candidate.status === "VERIFIED");
    const review = decoratedCandidates.filter((candidate) => candidate.status === "REVIEW");
    const unknown = decoratedCandidates.filter((candidate) => candidate.status === "UNKNOWN");
    const notApplicable = decoratedCandidates.filter((candidate) => candidate.status === "NOT_APPLICABLE");
    const missingEditorialCountryState = decoratedCandidates.filter((candidate) => candidate.status === "MISSING");

    const failures = [];
    if (duplicateEditorialEntries.length > 0) failures.push("Duplicate editorial entries found");
    if (validation.invalidStates.length > 0) failures.push("Invalid editorial country review states found");
    if (validation.invalidCountrySlugs.length > 0) failures.push("Invalid country slugs found");
    if (validation.brokenCountryReferences.length > 0) failures.push("Broken country references found");
    if (validation.hiddenPersonConsistency.length > 0) failures.push("Hidden person country consistency issues found");
    if (missingEditorialCountryState.length > 0) failures.push("Missing editorial country state for review candidates");

    const summary = {
      command: "verify:country-review",
      status: failures.length === 0 ? "PASS" : "FAIL",
      candidates: candidates.length,
      verified: verified.length,
      review: review.length,
      unknown: unknown.length,
      notApplicable: notApplicable.length,
      brokenReferences: validation.brokenCountryReferences.length,
      validation: {
        invalidCountrySlugs: validation.invalidCountrySlugs.length,
        duplicateEditorialEntries: duplicateEditorialEntries.length,
        hiddenPersonConsistency: validation.hiddenPersonConsistency.length,
        missingEditorialCountryState: missingEditorialCountryState.length,
        invalidStates: validation.invalidStates.length,
        unknownEditorialSlugs: validation.unknownEditorialSlugs.length,
      },
      failures,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("country-review-summary.json", {
      ...summary,
      records: decoratedCandidates,
      validationDetails: {
        duplicateEditorialEntries,
        ...validation,
        missingEditorialCountryState,
      },
    });
    await writeArtifact("summary.json", summary);
    await writeArtifact("verified.json", summarize(verified));
    await writeArtifact("review.json", summarize(review));
    await writeArtifact("unknown.json", summarize(unknown));
    await writeArtifact("not-applicable.json", summarize(notApplicable));

    console.log("\nCountry Review\n");
    console.log(`Candidates: ${summary.candidates}`);
    console.log(`Verified: ${summary.verified}`);
    console.log(`Review: ${summary.review}`);
    console.log(`Unknown: ${summary.unknown}`);
    console.log(`Not Applicable: ${summary.notApplicable}`);
    console.log("");
    console.log(`Broken References: ${summary.brokenReferences}`);
    console.log("");
    console.log(`Status: ${summary.status}`);

    if (summary.status !== "PASS") {
      console.log(JSON.stringify(summary.validation, null, 2));
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

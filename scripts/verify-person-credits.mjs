import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const artifactRoot = path.join(repoRoot, "data", "imports", "person-credits");
const rawRecordsPath = path.join(repoRoot, "data", "imports", "tmdb-pilot-100", "raw", "external-movie-records.json");
const editorialPath = path.join(repoRoot, "data", "editorial", "persons.json");
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

function classifyCredit(credit) {
  if (credit.role === "director") return "DIRECTOR";
  if (credit.role !== "actor") return "UNVERIFIED";

  const character = String(credit.character ?? "").toLowerCase();
  if (character.includes("archive footage")) return "ARCHIVE_FOOTAGE";
  if (/\bself\b|himself|herself|themselves/.test(character)) return "SELF_APPEARANCE";
  if (character.includes("interview")) return "INTERVIEWEE";
  if (character.includes("narrator")) return "NARRATOR";
  if (character.includes("voice")) return "VOICE_ONLY";
  if (character.includes("uncredited")) return "UNVERIFIED";
  return "ACTOR";
}

function finalStatus(classes, hidden) {
  if (classes.has("DIRECTOR") && !classes.has("ACTOR")) return "PUBLISHED_DIRECTOR";
  if (classes.has("ACTOR")) return "PUBLISHED_ACTOR";
  if (hidden) return "EXCLUDED";
  if (classes.has("ARCHIVE_FOOTAGE") || classes.has("SELF_APPEARANCE")) return "EXCLUDED_CANDIDATE";
  if (classes.has("NARRATOR") || classes.has("VOICE_ONLY") || classes.has("INTERVIEWEE") || classes.has("UNVERIFIED")) {
    return "NEEDS_REVIEW";
  }
  return "UNVERIFIED";
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(artifactRoot, { recursive: true });
  await fs.writeFile(path.join(artifactRoot, fileName), JSON.stringify(payload, null, 2));
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:person-credits.");
  }

  const [rawRecords, editorial, quality] = await Promise.all([
    fs.readFile(rawRecordsPath, "utf8").then(JSON.parse),
    fs.readFile(editorialPath, "utf8").then(JSON.parse),
    fs.readFile(qualityPath, "utf8").then(JSON.parse),
  ]);
  const hiddenSlugs = new Set(
    editorial.persons.filter((person) => person.hidden === true).map((person) => person.slug),
  );
  const hiddenNames = new Set(
    quality.excludedActors.map((person) => normalizeName(person.name)),
  );

  const byTmdbId = new Map();
  for (const movie of rawRecords) {
    for (const credit of movie.credits ?? []) {
      if (!["actor", "director"].includes(credit.role)) continue;
      const tmdbId = String(credit.externalIds?.tmdbId ?? credit.externalPersonId ?? "");
      if (!tmdbId) continue;
      const entry = byTmdbId.get(tmdbId) ?? {
        tmdbId,
        name: credit.name,
        slug: slugify(credit.name),
        classes: new Set(),
        credits: [],
      };
      const classification = classifyCredit(credit);
      entry.classes.add(classification);
      entry.credits.push({
        movieTitle: movie.metadata?.title,
        providerMovieId: movie.providerMovieId,
        role: credit.role,
        character: credit.character,
        billingOrder: credit.billingOrder,
        classification,
      });
      byTmdbId.set(tmdbId, entry);
    }
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const publishedActors = await client.query(
      `SELECT p.id, p.display_name, e.external_value AS tmdb_id
       FROM catalog_people p
       JOIN catalog_external_ids e
         ON e.entity_type = 'person'
        AND e.entity_id = p.id
        AND e.provider = 'tmdb'
        AND e.external_key = 'tmdbId'
       WHERE p.roles ? 'actor'`,
    );
    const actorTmdbIds = new Set(publishedActors.rows.map((row) => String(row.tmdb_id)));
    const results = [...byTmdbId.values()].map((entry) => {
      const classes = entry.classes;
      const hidden = hiddenSlugs.has(entry.slug) || hiddenNames.has(normalizeName(entry.name));
      return {
        tmdbId: entry.tmdbId,
        name: entry.name,
        slug: entry.slug,
        classes: [...classes].sort(),
        status: finalStatus(classes, hidden),
        publishedAsActor: actorTmdbIds.has(entry.tmdbId) && !hidden,
        hidden,
        creditCount: entry.credits.length,
        credits: entry.credits,
      };
    });

    const published = results.filter((item) => item.publishedAsActor && item.status === "PUBLISHED_ACTOR");
    const excluded = results.filter((item) => item.status === "EXCLUDED");
    const excludedCandidates = results.filter((item) => item.status === "EXCLUDED_CANDIDATE");
    const needsReview = results.filter((item) => item.status === "NEEDS_REVIEW");
    const mixedCredits = results.filter((item) => item.classes.length > 1);
    const hiddenStillPublished = results.filter((item) => item.hidden && actorTmdbIds.has(item.tmdbId));

    const breakdown = results.reduce((counts, item) => {
      for (const classification of item.classes) {
        counts[classification] = (counts[classification] ?? 0) + 1;
      }
      return counts;
    }, {});
    const hardFailures = hiddenStillPublished.filter((item) => item.publishedAsActor);
    const summary = {
      command: "verify:person-credits",
      status: hardFailures.length === 0 ? "PASS" : "FAIL",
      rawPersons: results.length,
      publishedActors: published.length,
      publishedDirectors: results.filter((item) => item.classes.includes("DIRECTOR")).length,
      excluded: excluded.length,
      excludedCandidates: excludedCandidates.length,
      needsReview: needsReview.length,
      mixedCredits: mixedCredits.length,
      eligibilityBreakdown: breakdown,
      hiddenStillPublished: hardFailures.length,
      completedAt: new Date().toISOString(),
    };

    await writeArtifact("summary.json", summary);
    await writeArtifact("published-actors.json", published);
    await writeArtifact("excluded.json", excluded);
    await writeArtifact("excluded-candidates.json", excludedCandidates);
    await writeArtifact("needs-review.json", needsReview);
    await writeArtifact("mixed-credits.json", mixedCredits);
    console.table([summary]);

    if (summary.status !== "PASS") {
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

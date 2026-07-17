import fs from "node:fs/promises";
import path from "node:path";
import { createPool, hasDatabaseUrl, repoRoot } from "./lib/postgres-pilot-utils.mjs";

const japanHeroPath = path.join(repoRoot, "public", "images", "home", "featured-journey-japan-desktop.webp");

async function count(client, sql) {
  const result = await client.query(sql);
  return Number(result.rows[0]?.count ?? 0);
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is required for verify:media.");
  }

  const pool = createPool();
  const client = await pool.connect();
  try {
    const moviesWithPoster = await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NOT NULL AND poster_path <> ''");
    const moviesWithoutPoster = await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NULL OR poster_path = ''");
    const moviesWithBackdrop = await count(client, "SELECT COUNT(*) FROM catalog_movies WHERE backdrop_path IS NOT NULL AND backdrop_path <> ''");
    const personsWithProfile = await count(client, "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NOT NULL AND profile_path <> ''");
    const personsWithoutProfile = await count(client, "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NULL OR profile_path = ''");
    const directorProfiles = await count(client, "SELECT COUNT(*) FROM catalog_people WHERE roles ? 'director' AND profile_path IS NOT NULL AND profile_path <> ''");
    const actorProfiles = await count(client, "SELECT COUNT(*) FROM catalog_people WHERE roles ? 'actor' AND profile_path IS NOT NULL AND profile_path <> ''");

    const japanHeroExists = await fs
      .access(japanHeroPath)
      .then(() => true)
      .catch(() => false);

    const malformedPosterPaths = await count(
      client,
      "SELECT COUNT(*) FROM catalog_movies WHERE poster_path IS NOT NULL AND poster_path <> '' AND poster_path NOT LIKE '/%'",
    );
    const malformedProfilePaths = await count(
      client,
      "SELECT COUNT(*) FROM catalog_people WHERE profile_path IS NOT NULL AND profile_path <> '' AND profile_path NOT LIKE '/%'",
    );

    const summary = {
      command: "verify:media",
      status: japanHeroExists && malformedPosterPaths === 0 && malformedProfilePaths === 0 ? "PASS" : "FAIL",
      moviesWithPoster,
      moviesWithoutPoster,
      moviesWithBackdrop,
      personsWithProfile,
      personsWithoutProfile,
      directorProfiles,
      actorProfiles,
      countryEditorialImages: {
        japan: japanHeroExists,
      },
      malformedPosterPaths,
      malformedProfilePaths,
      fallbackCoverage: "EntityImage fallback handles missing poster/profile/hero media.",
      completedAt: new Date().toISOString(),
    };

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

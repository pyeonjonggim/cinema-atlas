import fs from "node:fs/promises";
import path from "node:path";

import {
  createPool,
  hasDatabaseUrl,
  repoRoot,
  writePilotArtifact,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact("migration-summary.json", "db:migrate");
    return;
  }

  const migrationsRoot = path.join(repoRoot, "db", "migrations");
  const files = (await fs.readdir(migrationsRoot))
    .filter((file) => file.endsWith(".sql") && !file.endsWith(".down.sql"))
    .sort();
  const pool = createPool();
  const applied = [];
  const skipped = [];

  try {
    await pool.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    );

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const existing = await pool.query("SELECT version FROM schema_migrations WHERE version = $1", [
        version,
      ]);
      if (existing.rowCount) {
        skipped.push(version);
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(await fs.readFile(path.join(migrationsRoot, file), "utf8"));
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
          [version],
        );
        await client.query("COMMIT");
        applied.push(version);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    const summary = {
      command: "db:migrate",
      status: "PASS",
      applied,
      skipped,
      migrationCount: files.length,
      completedAt: new Date().toISOString(),
    };
    await writePilotArtifact("migration-summary.json", summary);
    console.table([summary]);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

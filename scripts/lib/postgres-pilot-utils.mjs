import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const pilotOutputRoot = path.join(repoRoot, "data", "imports", "postgres-catalog-pilot");
export const persistenceRoot = path.join(repoRoot, "data", "imports", "catalog-persistence-pilot");

function loadDotEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

export async function ensurePilotOutputRoot() {
  await fs.mkdir(pilotOutputRoot, { recursive: true });
}

export async function writePilotArtifact(fileName, payload) {
  await ensurePilotOutputRoot();
  await fs.writeFile(path.join(pilotOutputRoot, fileName), JSON.stringify(payload, null, 2));
}

export async function writeSkippedArtifact(fileName, command) {
  const payload = {
    command,
    status: "SKIPPED",
    reason: "DATABASE_URL is not configured. Add DATABASE_URL to .env.local to run this command against PostgreSQL.",
    skippedAt: new Date().toISOString(),
  };
  await writePilotArtifact(fileName, payload);
  console.table([payload]);
  return payload;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function createPool() {
  const { Pool } = pg;
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function readPersistenceArtifacts() {
  const [movies, entities, edges, summary] = await Promise.all([
    readJson(path.join(persistenceRoot, "movies.json")),
    readJson(path.join(persistenceRoot, "entities.json")),
    readJson(path.join(persistenceRoot, "edges.json")),
    readJson(path.join(persistenceRoot, "summary.json")),
  ]);
  return { movies, entities, edges, summary };
}

export function externalIdRows(entityType, entityId, externalIds = {}) {
  const rows = [];
  if (externalIds.tmdbId) {
    rows.push({
      id: `${entityType}:${entityId}:tmdb:tmdbId:${externalIds.tmdbId}`,
      entityType,
      entityId,
      provider: "tmdb",
      providerEntityId: String(externalIds.tmdbId),
      externalKey: "tmdbId",
      externalValue: String(externalIds.tmdbId),
    });
  }
  if (externalIds.imdbId) {
    rows.push({
      id: `${entityType}:${entityId}:imdb:imdbId:${externalIds.imdbId}`,
      entityType,
      entityId,
      provider: "imdb",
      providerEntityId: String(externalIds.imdbId),
      externalKey: "imdbId",
      externalValue: String(externalIds.imdbId),
    });
  }
  if (externalIds.wikidataId) {
    rows.push({
      id: `${entityType}:${entityId}:wikidata:wikidataId:${externalIds.wikidataId}`,
      entityType,
      entityId,
      provider: "wikidata",
      providerEntityId: String(externalIds.wikidataId),
      externalKey: "wikidataId",
      externalValue: String(externalIds.wikidataId),
    });
  }
  return rows;
}

export async function upsertExternalIds(client, entityType, entityId, externalIds) {
  for (const row of externalIdRows(entityType, entityId, externalIds)) {
    await client.query(
      `INSERT INTO catalog_external_ids (
        id, entity_type, entity_id, provider, provider_entity_id, external_key, external_value
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (entity_type, provider, external_key, external_value) DO UPDATE SET
        entity_id = EXCLUDED.entity_id,
        provider_entity_id = EXCLUDED.provider_entity_id`,
      [
        row.id,
        row.entityType,
        row.entityId,
        row.provider,
        row.providerEntityId,
        row.externalKey,
        row.externalValue,
      ],
    );
  }
}

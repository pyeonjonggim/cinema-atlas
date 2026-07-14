import "server-only";

import { Pool } from "pg";

type GlobalWithPool = typeof globalThis & {
  __cinemaAtlasPgPool?: Pool;
};

export type PostgresConfig = {
  connectionString: string;
  ssl?: boolean;
  max?: number;
};

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPostgresConfig(): PostgresConfig | undefined {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return undefined;

  return {
    connectionString,
    ssl: process.env.DATABASE_SSL === "true",
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  };
}

export function getPostgresPool(config = getPostgresConfig()): Pool {
  if (!config) {
    throw new Error("DATABASE_URL is required for PostgresCatalogRepository.");
  }

  const globalWithPool = globalThis as GlobalWithPool;
  if (!globalWithPool.__cinemaAtlasPgPool) {
    globalWithPool.__cinemaAtlasPgPool = new Pool({
      connectionString: config.connectionString,
      max: config.max,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return globalWithPool.__cinemaAtlasPgPool;
}

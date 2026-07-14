import "server-only";

import { InMemoryCatalogRepository } from "@/lib/catalogPersistence";
import { hasDatabaseUrl } from "@/lib/db/postgres";
import { PostgresCatalogRepository } from "@/lib/postgresCatalogRepository";
import type { CatalogRepository } from "@/types/catalogPersistence";

export type CatalogRepositoryKind = "postgres" | "in-memory";

export function getCatalogRepositoryKind(): CatalogRepositoryKind {
  return hasDatabaseUrl() ? "postgres" : "in-memory";
}

export function createCatalogRepository(): CatalogRepository {
  if (hasDatabaseUrl()) {
    return new PostgresCatalogRepository();
  }

  return new InMemoryCatalogRepository();
}

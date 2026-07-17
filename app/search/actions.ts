"use server";

import { searchCatalog, type SearchEntityType } from "@/lib/search";

export async function searchOverlayCatalog(query: string, entityTypes?: SearchEntityType[]) {
  return searchCatalog(query, {
    entityTypes,
    limit: 12,
  });
}


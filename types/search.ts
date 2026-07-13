import type { CatalogEntityType } from "@/types/catalog";

export type SearchDocumentType =
  | CatalogEntityType
  | "journey"
  | "collection"
  | "journal";

export type SearchDocument = {
  id: string;
  type: SearchDocumentType;
  title: string;
  subtitle?: string;
  description?: string;
  route: string;
  keywords: string[];
  facets?: Record<string, string[]>;
  popularity?: number;
  updatedAt?: string;
};

export type SearchIndexSource = {
  name: string;
  documents: SearchDocument[];
};


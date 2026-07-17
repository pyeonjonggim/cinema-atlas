export type SearchEntityType =
  | "movie"
  | "director"
  | "actor"
  | "country"
  | "movement"
  | "award";

export type SearchMatchType =
  | "exact"
  | "prefix"
  | "word-start"
  | "substring"
  | "metadata";

export type UnifiedSearchResult = {
  id: string;
  slug: string;
  entityType: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  imageUrl?: string;
  year?: number;
  country?: string;
  matchedField?: string;
  matchType?: SearchMatchType;
  score: number;
};

export type SearchCatalogOptions = {
  entityTypes?: SearchEntityType[];
  limit?: number;
};

export type SearchableField = {
  field: string;
  value?: string | number | Array<string | number | undefined>;
  metadata?: boolean;
};

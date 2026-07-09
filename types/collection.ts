export type CollectionKind = "system" | "smart" | "user" | "official";

export type CollectionRuleType =
  | "watchStatus"
  | "favorite"
  | "journaled"
  | "ratingAtLeast"
  | "country"
  | "award"
  | "genre"
  | "kind";

export type CollectionRule = {
  type: CollectionRuleType;
  value?: string | number | boolean;
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  kind: CollectionKind;
  movieIds?: string[];
  rule?: CollectionRule;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

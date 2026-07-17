import type { EditorialEntityKind, EditorialEntityStatus, EditorialEntitySourceType } from "@/lib/editorial/metadata";
import type { EditorialEntityRelationshipSlugs } from "@/lib/editorial/relationships";

export type EditorialProjectionBase = EditorialEntityRelationshipSlugs & {
  slug: string;
  kind: EditorialEntityKind;
  name: string;
  description: string;
  whyItMatters?: string;
  status: EditorialEntityStatus;
  sourceType: EditorialEntitySourceType;
};

export type MovementProjection = EditorialProjectionBase & {
  kind: "movement";
  period?: string;
  themes: string[];
  characteristics: string[];
  starterMovieSlug?: string;
};

export type AwardProjection = EditorialProjectionBase & {
  kind: "award";
  organization?: string;
  countrySlug?: string;
  foundedYear?: number;
  overview: string[];
  starterMovieSlug?: string;
};

export type EditorialProjection = MovementProjection | AwardProjection | EditorialProjectionBase;
import type { EditorialEntityKind, EditorialMetadata } from "@/lib/editorial/metadata";
import type { EditorialEntityRelationshipSlugs } from "@/lib/editorial/relationships";

export type EditorialEntityBase = EditorialMetadata &
  EditorialEntityRelationshipSlugs & {
    id: string;
    slug: string;
    kind: EditorialEntityKind;
    name: string;
    description: string;
    whyItMatters?: string;
  };

export type MovementEditorialEntity = EditorialEntityBase & {
  kind: "movement";
  period?: string;
  themes?: string[];
  characteristics?: string[];
  starterMovieSlug?: string;
};

export type AwardEditorialEntity = EditorialEntityBase & {
  kind: "award";
  organization?: string;
  countrySlug?: string;
  foundedYear?: number;
  overview?: string[];
  starterMovieSlug?: string;
};

export type EditorialEntity = MovementEditorialEntity | AwardEditorialEntity;

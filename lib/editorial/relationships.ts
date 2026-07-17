import type { EditorialEntityKind } from "@/lib/editorial/metadata";

export type EditorialRelationshipTargetKind =
  | "movie"
  | "director"
  | "actor"
  | "country"
  | "movement"
  | "award"
  | EditorialEntityKind;

export type EditorialEntityRelationshipSlugs = {
  movieSlugs?: string[];
  directorSlugs?: string[];
  actorSlugs?: string[];
  countrySlugs?: string[];
  relatedEntitySlugs?: string[];
};

export type EditorialRelationship = {
  sourceKind: EditorialEntityKind;
  sourceSlug: string;
  targetKind: EditorialRelationshipTargetKind;
  targetSlug: string;
  relationshipType:
    | "features"
    | "originates-in"
    | "recognizes"
    | "belongs-to"
    | "related-to"
    | "recommended-starting-point";
  isCurated: true;
};
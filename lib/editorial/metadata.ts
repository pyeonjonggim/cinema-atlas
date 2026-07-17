export type EditorialEntityStatus = "draft" | "published" | "archived";

export type EditorialEntitySourceType = "editorial" | "external" | "hybrid";

export type EditorialEntityKind =
  | "movement"
  | "award"
  | "studio"
  | "festival"
  | "film-history-event"
  | "theme"
  | "technique"
  | "course"
  | "collection";

export type EditorialRevisionMetadata = {
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
};

export type EditorialMetadata = EditorialRevisionMetadata & {
  status: EditorialEntityStatus;
  sourceType: EditorialEntitySourceType;
};
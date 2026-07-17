import type { CatalogImageRef } from "@/types/catalog";

export type MediaSource = "tmdb" | "editorial" | "local" | "unknown";
export type ImageKind = "poster" | "backdrop" | "profile" | "hero" | "logo";

export type EntityImage = {
  kind: ImageKind;
  source: MediaSource;
  path?: string;
  url?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  alt: string;
  attribution?: {
    provider?: string;
    creator?: string;
    sourceUrl?: string;
    license?: string;
  };
  objectPosition?: string;
};

export type ImagePreset =
  | "poster-card"
  | "poster-detail"
  | "profile-card"
  | "profile-hero"
  | "backdrop-hero"
  | "hero";

const tmdbSizes: Record<ImagePreset, string> = {
  "poster-card": "w342",
  "poster-detail": "w500",
  "profile-card": "w185",
  "profile-hero": "h632",
  "backdrop-hero": "w1280",
  hero: "w1280",
};

export function imageFromCatalogRef(
  ref: CatalogImageRef | undefined,
  kind: ImageKind,
  alt: string,
): EntityImage | null {
  if (!ref?.path && !ref?.url) return null;

  return {
    kind,
    source: ref.source === "external-metadata" ? "tmdb" : ref.source === "cinema-atlas" ? "editorial" : "unknown",
    path: ref.path,
    url: ref.url,
    alt: ref.alt ?? alt,
    attribution: ref.sourceId ? { provider: ref.sourceId } : undefined,
  };
}

export function resolveImageUrl(image: EntityImage | null | undefined, preset: ImagePreset): string | null {
  if (!image) return null;
  if (image.url) return image.url;
  if (image.source === "tmdb" && image.path) {
    return `https://image.tmdb.org/t/p/${tmdbSizes[preset]}${image.path}`;
  }
  if ((image.source === "local" || image.source === "editorial") && image.path) {
    return image.path;
  }
  return null;
}

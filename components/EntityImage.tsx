"use client";

import Image from "next/image";
import { useState } from "react";

import { resolveImageUrl, type EntityImage as EntityImageModel, type ImagePreset } from "@/lib/media";

type EntityImageProps = {
  image?: EntityImageModel | null;
  fallbackLabel: string;
  variant: "poster" | "profile" | "hero" | "thumbnail";
  priority?: boolean;
  sizes?: string;
  className?: string;
  objectPosition?: string;
};

const presetByVariant: Record<EntityImageProps["variant"], ImagePreset> = {
  poster: "poster-detail",
  profile: "profile-hero",
  hero: "hero",
  thumbnail: "poster-card",
};

const fallbackClass: Record<EntityImageProps["variant"], string> = {
  poster: "aspect-[2/3]",
  profile: "aspect-[3/4]",
  hero: "aspect-[16/9]",
  thumbnail: "aspect-[2/3]",
};

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function EntityImage({
  image,
  fallbackLabel,
  variant,
  priority = false,
  sizes,
  className = "",
  objectPosition,
}: EntityImageProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : resolveImageUrl(image, presetByVariant[variant]);

  if (!url) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.14),transparent_34%),linear-gradient(145deg,rgba(39,39,42,0.95),rgba(9,9,11,1))] text-center text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 ${fallbackClass[variant]} ${className}`}
        aria-label={fallbackLabel}
      >
        <span>{initials(fallbackLabel) || "CA"}</span>
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={image?.alt || fallbackLabel}
      fill
      sizes={sizes}
      priority={priority}
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: objectPosition ?? image?.objectPosition ?? "center" }}
      onError={() => setFailed(true)}
    />
  );
}

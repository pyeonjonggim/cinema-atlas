import Image from "next/image";
import type { ReactNode } from "react";

type EntityCardVisualProps = {
  label: "MOVIE" | "DIRECTOR" | "COUNTRY" | "MOVEMENT" | "ACTOR" | "AWARD";
  image?: string;
  imageAlt?: string;
  tone?: "movie" | "person" | "place" | "movement" | "award" | "default";
  children?: ReactNode;
};

export default function EntityCardVisual({
  label,
  image,
  imageAlt = "",
  tone = "default",
  children,
}: EntityCardVisualProps) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
      {image ? (
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 14vw, (min-width: 768px) 20vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 ${getPlaceholderClass(tone)}`} />
      )}

      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function getPlaceholderClass(tone: EntityCardVisualProps["tone"]) {
  const classes = {
    movie:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(248,113,113,0.14),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]",
    person:
      "bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.14),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]",
    place:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.15),transparent_36%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.7))]",
    movement:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.16),transparent_36%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]",
    award:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(250,204,21,0.16),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]",
    default:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]",
  };

  return classes[tone ?? "default"];
}

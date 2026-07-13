import Image from "next/image";
import type { ReactNode } from "react";

type UniversalHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  search?: ReactNode;
  stats?: ReactNode;
  backgroundImage?: string;
  backgroundAlt?: string;
  imagePosition?: string;
  overlayStrength?: "soft" | "medium" | "strong";
  visualTone?:
    | "world"
    | "cinematic"
    | "place"
    | "portrait"
    | "archive"
    | "personal"
    | "explorer";
  minHeight?: "compact" | "standard" | "immersive" | "landing";
  align?: "left" | "center";
  mediaSlot?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
};

export default function UniversalHero({
  eyebrow,
  title,
  description,
  search,
  stats,
  backgroundImage,
  backgroundAlt = "",
  imagePosition = "center",
  overlayStrength = "strong",
  visualTone = "archive",
  minHeight = "standard",
  align = "left",
  mediaSlot,
  metadata,
  actions,
}: UniversalHeroProps) {
  const hasUtilityRow = search || stats || metadata || actions;

  return (
    <section
      className={`relative flex items-center overflow-hidden rounded-[var(--atlas-radius-hero)] border border-[var(--atlas-border)] bg-[var(--atlas-bg-elevated)] p-8 shadow-[0_32px_110px_rgba(0,0,0,0.42)] md:p-14 ${getHeightClass(
        minHeight
      )}`}
      style={minHeight === "landing" ? { minHeight: 552 } : undefined}
    >
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt={backgroundAlt}
          fill
          sizes="100vw"
          priority
          className="pointer-events-none object-cover opacity-100"
          style={{ objectPosition: imagePosition }}
        />
      )}

      {!backgroundImage && (
        <div className={`pointer-events-none absolute inset-0 ${getToneClass(visualTone)}`} />
      )}
      <div className={`pointer-events-none absolute inset-0 ${getOverlayClass(overlayStrength)}`} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_24%,rgba(255,255,255,0.018)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {!backgroundImage && !mediaSlot && (
        <div className="pointer-events-none absolute right-8 top-8 hidden h-[calc(100%-4rem)] w-[34%] lg:block">
          <div className="grid h-full grid-cols-3 gap-3 opacity-70">
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.055]" />
            <div className="rounded-2xl border border-white/10 bg-white/[0.075]" />
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.045]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/10 to-neutral-950/80" />
        </div>
      )}

      {mediaSlot && (
        <div className="absolute right-8 top-8 hidden h-[calc(100%-4rem)] w-[34%] lg:block">
          {mediaSlot}
        </div>
      )}

      <div
        className={`relative z-10 flex max-w-[42rem] flex-col justify-center ${
          align === "center" ? "mx-auto items-center text-center" : ""
        }`}
      >
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-text-subtle)]">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.01em] text-[var(--atlas-text-on-image)] md:text-7xl">
          {title}
        </h1>

        {description && (
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--atlas-text-muted)] md:text-base">
            {description}
          </p>
        )}

        {hasUtilityRow && (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {search && <div className="w-full max-w-xl">{search}</div>}
            {metadata && (
              <div className="shrink-0 text-sm font-medium text-[var(--atlas-text-muted)]">
                {metadata}
              </div>
            )}
            {stats && (
              <div className="shrink-0 text-sm font-medium text-[var(--atlas-text-muted)]">
                {stats}
              </div>
            )}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
      </div>
    </section>
  );
}

function getHeightClass(minHeight: UniversalHeroProps["minHeight"]) {
  const classes = {
    compact: "md:min-h-[15rem]",
    standard: "md:min-h-[19rem]",
    immersive: "md:min-h-[26rem]",
    landing: "",
  };

  return classes[minHeight ?? "standard"];
}

function getOverlayClass(overlayStrength: UniversalHeroProps["overlayStrength"]) {
  const classes = {
    soft:
      "bg-[linear-gradient(110deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.48)_48%,rgba(0,0,0,0.18)_100%)]",
    medium:
      "bg-[linear-gradient(110deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.58)_48%,rgba(0,0,0,0.22)_100%)]",
    strong:
      "bg-[linear-gradient(105deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.76)_36%,rgba(0,0,0,0.38)_58%,rgba(0,0,0,0.08)_100%)]",
  };

  return classes[overlayStrength ?? "strong"];
}

function getToneClass(visualTone: UniversalHeroProps["visualTone"]) {
  const classes = {
    world:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(31,122,104,0.28),transparent_32%),linear-gradient(135deg,rgba(6,18,25,0.72),rgba(9,8,7,0.96))]",
    cinematic:
      "bg-[radial-gradient(circle_at_78%_22%,rgba(40,86,140,0.24),transparent_34%),linear-gradient(135deg,rgba(23,18,15,0.78),rgba(9,8,7,0.98))]",
    place:
      "bg-[radial-gradient(circle_at_78%_20%,rgba(31,122,104,0.24),transparent_34%),linear-gradient(135deg,rgba(12,24,21,0.78),rgba(9,8,7,0.98))]",
    portrait:
      "bg-[radial-gradient(circle_at_78%_18%,rgba(244,241,234,0.16),transparent_32%),linear-gradient(135deg,rgba(24,22,20,0.84),rgba(9,8,7,0.98))]",
    archive:
      "bg-[radial-gradient(circle_at_78%_20%,rgba(143,136,124,0.16),transparent_34%),linear-gradient(135deg,rgba(18,17,15,0.86),rgba(9,8,7,0.98))]",
    personal:
      "bg-[radial-gradient(circle_at_78%_20%,rgba(78,104,129,0.22),transparent_34%),linear-gradient(135deg,rgba(16,19,23,0.84),rgba(9,8,7,0.98))]",
    explorer:
      "bg-[radial-gradient(circle_at_78%_20%,rgba(31,122,104,0.22),transparent_34%),linear-gradient(135deg,rgba(13,22,18,0.84),rgba(9,8,7,0.98))]",
  };

  return classes[visualTone ?? "archive"];
}

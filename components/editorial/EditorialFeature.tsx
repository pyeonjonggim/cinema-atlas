import Image from "next/image";
import type { ReactNode } from "react";

import AtlasButton from "@/components/ui/AtlasButton";

type EditorialFeatureProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  metadata?: ReactNode;
  ctaLabel?: string;
  action?: {
    label: string;
    href: string;
  };
  orientation?: "image-left" | "image-right" | "full-bleed";
  layout?: "balanced" | "editorial";
  supportingItems?: ReactNode;
};

export default function EditorialFeature({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  imagePosition = "center",
  metadata,
  ctaLabel,
  action,
  orientation = "image-left",
  layout = "balanced",
  supportingItems,
}: EditorialFeatureProps) {
  const fullBleed = orientation === "full-bleed";
  const splitClass =
    layout === "editorial"
      ? "md:grid-cols-[2fr_3fr]"
      : "md:grid-cols-2";

  return (
    <section
      className={`overflow-hidden rounded-[var(--atlas-radius-feature)] border border-[var(--atlas-border)] bg-[var(--atlas-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.22)] ${
        fullBleed ? "relative min-h-[24rem] p-6 md:p-10" : `grid gap-0 ${splitClass}`
      }`}
      style={
        !fullBleed && layout === "editorial"
          ? { gridTemplateColumns: "2fr 3fr" }
          : undefined
      }
    >
      <div
        className={`relative min-h-[390px] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))] ${
          orientation === "image-right" ? "md:order-2" : ""
        } ${fullBleed ? "absolute inset-0" : ""}`}
        style={
          !fullBleed
            ? {
                minHeight: 390,
                order: orientation === "image-right" ? 2 : undefined,
              }
            : undefined
        }
      >
        {image && (
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes={fullBleed ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
            className="object-cover transition duration-300 group-hover:scale-[1.015]"
            style={{ objectPosition: imagePosition }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/34 via-transparent to-transparent" />
      </div>

      <div
        className={`relative z-10 flex flex-col justify-end p-6 md:p-10 ${
          fullBleed ? "min-h-[20rem] max-w-3xl" : ""
        }`}
        style={
          !fullBleed
            ? { order: orientation === "image-right" ? 1 : undefined }
            : undefined
        }
      >
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-text-subtle)]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-4 text-3xl font-semibold leading-[1.02] tracking-[-0.01em] text-[var(--atlas-text)] md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--atlas-text-muted)] md:text-base">
            {description}
          </p>
        )}
        {metadata && (
          <div className="mt-5 text-sm font-medium text-[var(--atlas-text-subtle)]">
            {metadata}
          </div>
        )}
        {action && (
          <div className="mt-6">
            <AtlasButton href={action.href}>{ctaLabel ?? action.label}</AtlasButton>
          </div>
        )}
        {supportingItems && <div className="mt-6">{supportingItems}</div>}
      </div>
    </section>
  );
}

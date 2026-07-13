import Image from "next/image";
import type { ReactNode } from "react";

import AtlasButton from "@/components/ui/AtlasButton";

type EditorialFeatureProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  metadata?: ReactNode;
  action?: {
    label: string;
    href: string;
  };
  orientation?: "image-left" | "image-right" | "full-bleed";
  supportingItems?: ReactNode;
};

export default function EditorialFeature({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  metadata,
  action,
  orientation = "image-left",
  supportingItems,
}: EditorialFeatureProps) {
  const fullBleed = orientation === "full-bleed";

  return (
    <section
      className={`overflow-hidden rounded-[var(--atlas-radius-feature)] border border-[var(--atlas-border)] bg-[var(--atlas-surface)] ${
        fullBleed ? "relative min-h-[24rem] p-6 md:p-10" : "grid gap-0 md:grid-cols-2"
      }`}
    >
      <div
        className={`relative min-h-72 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))] ${
          orientation === "image-right" ? "md:order-2" : ""
        } ${fullBleed ? "absolute inset-0" : ""}`}
      >
        {image && (
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes={fullBleed ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
            className="object-cover transition duration-300 group-hover:scale-[1.015]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div
        className={`relative z-10 flex flex-col justify-end p-6 md:p-8 ${
          fullBleed ? "min-h-[20rem] max-w-3xl" : ""
        }`}
      >
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--atlas-text-subtle)]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--atlas-text)] md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--atlas-text-muted)] md:text-base">
            {description}
          </p>
        )}
        {metadata && (
          <div className="mt-4 text-sm text-[var(--atlas-text-subtle)]">
            {metadata}
          </div>
        )}
        {action && (
          <div className="mt-5">
            <AtlasButton href={action.href}>{action.label}</AtlasButton>
          </div>
        )}
        {supportingItems && <div className="mt-6">{supportingItems}</div>}
      </div>
    </section>
  );
}

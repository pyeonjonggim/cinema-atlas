import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";

import AtlasCard from "../ui/AtlasCard";
import Section from "../layout/Section";

export type RelationshipPreviewItem = {
  href: string;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  imageAspect?: "wide" | "poster" | "portrait";
  visualTone?: "person" | "place" | "movement" | "award" | "movie" | "default";
};

type RelationshipPreviewPatternProps = {
  title: string;
  description?: string;
  items: RelationshipPreviewItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  limit?: number;
  renderItem?: (item: RelationshipPreviewItem) => ReactNode;
};

export default function RelationshipPreviewPattern({
  title,
  description,
  items,
  viewAllHref,
  viewAllLabel = "View All",
  emptyMessage = "No relationships available yet.",
  limit = 3,
  renderItem,
}: RelationshipPreviewPatternProps) {
  const previewItems = items.slice(0, limit);

  return (
    <Section
      title={title}
      description={description}
      className="p-4 md:p-5"
      action={
        viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-neutral-400 transition hover:text-white"
          >
            {viewAllLabel}
          </Link>
        ) : undefined
      }
    >
      {previewItems.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {previewItems.map((item, index) =>
            renderItem ? (
              <div key={`${item.href}-${item.label}-${index}`}>
                {renderItem(item)}
              </div>
            ) : item.imageAspect === "poster" ? (
              <AtlasCard
                key={`${item.href}-${item.label}-${index}`}
                href={item.href}
                className="h-full p-0"
              >
                <div className="grid h-full grid-cols-[72px_1fr] gap-3 p-3">
                  <div className="relative overflow-hidden rounded-xl bg-neutral-900">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.imageAlt ?? item.title}
                        width={144}
                        height={216}
                        sizes="72px"
                        className="aspect-[2/3] h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`aspect-[2/3] h-full w-full ${getPlaceholderClass(
                          item.visualTone
                        )}`}
                      />
                    )}
                  </div>

                  <div className="min-w-0 py-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {item.label}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-base font-semibold text-white">
                      {item.title}
                    </h3>

                    {item.subtitle && (
                      <p className="mt-2 line-clamp-1 text-xs text-neutral-500">
                        {item.subtitle}
                      </p>
                    )}

                    {item.meta && (
                      <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
                        {item.meta}
                      </p>
                    )}

                    <p className="mt-3 text-sm font-medium text-neutral-300">
                      Explore
                    </p>
                  </div>
                </div>
              </AtlasCard>
            ) : (
              <AtlasCard
                key={`${item.href}-${item.label}-${index}`}
                href={item.href}
                className="h-full p-0"
              >
                <div
                  className={`relative overflow-hidden rounded-2xl rounded-b-none bg-neutral-900 ${
                    item.imageAspect === "portrait"
                      ? "aspect-[3/4]"
                      : "aspect-[16/9]"
                  }`}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.imageAlt ?? item.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-300 hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${getPlaceholderClass(
                        item.visualTone
                      )}`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                    {item.label}
                  </p>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>

                  {item.subtitle && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
                      {item.subtitle}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    {item.meta && (
                      <p className="line-clamp-1 text-xs font-medium text-neutral-500">
                        {item.meta}
                      </p>
                    )}
                    <p className="ml-auto text-sm font-medium text-neutral-300">
                      Explore
                    </p>
                  </div>
                </div>
              </AtlasCard>
            )
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">{emptyMessage}</p>
      )}
    </Section>
  );
}

function getPlaceholderClass(visualTone: RelationshipPreviewItem["visualTone"]) {
  const tone = visualTone ?? "default";

  const classes = {
    person:
      "bg-[radial-gradient(circle_at_35%_20%,rgba(250,250,250,0.18),transparent_28%),linear-gradient(135deg,rgba(64,64,64,0.9),rgba(10,10,10,1))]",
    place:
      "bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.18),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.85),rgba(9,9,11,1))]",
    movement:
      "bg-[radial-gradient(circle_at_30%_15%,rgba(245,158,11,0.2),transparent_32%),linear-gradient(135deg,rgba(41,37,36,0.9),rgba(9,9,11,1))]",
    award:
      "bg-[radial-gradient(circle_at_50%_20%,rgba(250,204,21,0.24),transparent_26%),linear-gradient(135deg,rgba(63,63,70,0.85),rgba(9,9,11,1))]",
    movie:
      "bg-[radial-gradient(circle_at_30%_20%,rgba(248,113,113,0.18),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(9,9,11,1))]",
    default:
      "bg-[radial-gradient(circle_at_35%_20%,rgba(161,161,170,0.16),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.85),rgba(9,9,11,1))]",
  };

  return classes[tone];
}

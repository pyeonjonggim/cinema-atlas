import Link from "next/link";
import type { ReactNode } from "react";

import AtlasCard from "../ui/AtlasCard";
import Section from "../layout/Section";

export type RelationshipPreviewItem = {
  href: string;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
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
          {previewItems.map((item) =>
            renderItem ? (
              <div key={item.href}>{renderItem(item)}</div>
            ) : (
              <AtlasCard key={item.href} href={item.href} className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {item.label}
                </p>

                <h3 className="mt-3 text-lg font-semibold text-white">
                  {item.title}
                </h3>

                {item.subtitle && (
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {item.subtitle}
                  </p>
                )}

                {item.meta && (
                  <p className="mt-4 text-sm font-medium text-neutral-500">
                    {item.meta}
                  </p>
                )}
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

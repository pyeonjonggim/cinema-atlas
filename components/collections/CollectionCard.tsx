import Link from "next/link";

import type { CollectionView } from "@/lib/collections";

import CollectionCover from "./CollectionCover";

type CollectionCardProps = {
  view: CollectionView;
  compact?: boolean;
};

export default function CollectionCard({
  view,
  compact = false,
}: CollectionCardProps) {
  return (
    <Link
      href={`/my/collections/${view.collection.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <CollectionCover movies={view.movies} compact={compact} />

      <div className={compact ? "mt-3" : "mt-4"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {view.collection.kind} Collection
        </p>
        <h3 className="mt-2 line-clamp-1 text-lg font-semibold text-white">
          {view.collection.title}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {view.stats.movieCount} Movies
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-neutral-400">
          {view.collection.description}
        </p>
      </div>
    </Link>
  );
}

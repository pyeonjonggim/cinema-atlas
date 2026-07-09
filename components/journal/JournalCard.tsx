import Image from "next/image";
import Link from "next/link";

import type { JournalViewItem } from "@/components/journal/journalUtils";
import {
  formatJournalDate,
  formatJournalRating,
} from "@/components/journal/journalUtils";

type JournalCardProps = {
  item: JournalViewItem;
};

export default function JournalCard({ item }: JournalCardProps) {
  const { entry, movie, userMovie } = item;

  return (
    <Link
      href={`/my/journal/${entry.id}`}
      className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex-none">
        <div className="relative h-[84px] w-14 overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
          {movie?.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              sizes="56px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
          )}
        </div>

        <p className="mt-1 text-center text-[11px] text-neutral-500">
          {formatJournalRating(userMovie?.myRating)}
        </p>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>{formatJournalDate(entry.date)}</span>
          {entry.mood && <span>{entry.mood}</span>}
          {entry.containsSpoilers && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-300">
              Spoiler
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-1 text-sm font-medium text-neutral-300">
          {movie?.title ?? entry.movieId}
        </p>

        <h3 className="mt-0.5 line-clamp-1 text-base font-semibold text-white">
          {entry.title ?? "Untitled journal"}
        </h3>

        <p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-400">
          {entry.body}
        </p>
      </div>
    </Link>
  );
}

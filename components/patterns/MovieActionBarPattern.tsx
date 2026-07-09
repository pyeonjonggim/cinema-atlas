"use client";

import { useState } from "react";

import AtlasButton from "../ui/AtlasButton";
import RatingInput from "../journal/RatingInput";
import WatchStatus from "../journal/WatchStatus";

type MovieActionBarPatternProps = {
  averageRating: number;
  myRating?: number;
  movieId?: string;
};

export default function MovieActionBarPattern({
  averageRating,
  myRating = 0,
  movieId,
}: MovieActionBarPatternProps) {
  const hasRating = myRating > 0;
  const [showJournalPrompt, setShowJournalPrompt] = useState(false);
  const journalHref = movieId ? `/my/journal/new?movie=${movieId}` : "/my/journal/new";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Average Rating
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              **** {averageRating.toFixed(1)}
            </p>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {hasRating ? "My Rating" : "Rate This Film"}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <RatingInput value={hasRating ? myRating : 0} disabled />
              {hasRating && (
                <span className="text-sm font-medium text-neutral-300">
                  {myRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AtlasButton
            onClick={() => setShowJournalPrompt(true)}
            variant="secondary"
          >
            {hasRating ? "Edit Rating" : "Rate This Film"}
          </AtlasButton>
          <AtlasButton href={journalHref} variant="secondary">
            Write Journal
          </AtlasButton>
          <AtlasButton variant="secondary">Add to Watchlist</AtlasButton>
          <WatchStatus status="watched" />
        </div>
      </div>

      {showJournalPrompt && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              You rated this film.
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Would you like to remember this experience?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AtlasButton href={journalHref} variant="secondary">
              Write Journal
            </AtlasButton>
            <AtlasButton
              onClick={() => setShowJournalPrompt(false)}
              variant="ghost"
            >
              Maybe Later
            </AtlasButton>
          </div>
        </div>
      )}
    </section>
  );
}

import AtlasButton from "@/components/ui/AtlasButton";
import EmptyState from "@/components/ui/EmptyState";
import type { JournalEntry } from "@/types/journal";

import ActivityPoster from "./ActivityPoster";
import {
  type ActivityItem,
  formatActivityDate,
  formatRating,
  groupActivityByDay,
} from "./activity";

type MyActivityPreviewProps = {
  items: ActivityItem[];
  journalEntries: JournalEntry[];
  limit?: number;
};

export default function MyActivityPreview({
  items,
  journalEntries,
  limit = 10,
}: MyActivityPreviewProps) {
  const journalMovieIds = new Set(journalEntries.map((entry) => entry.movieId));
  const groups = groupActivityByDay(items.slice(0, limit));

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No activity yet."
        description="Watched films will become the first entries in your cinema timeline."
        actionLabel="Browse Movies"
        actionHref="/encyclopedia/movies"
      />
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.date} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
          <p className="text-sm font-medium text-neutral-300">
            {formatActivityDate(group.date)}
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            {group.items.map((item) => (
              <ActivityPoster
                key={item.userMovie.movieId}
                movie={item.movie}
                ratingLabel={formatRating(item.userMovie.myRating)}
                hasJournal={journalMovieIds.has(item.userMovie.movieId)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="pt-1">
        <AtlasButton href="/my/activity" variant="secondary">
          View Full Activity
        </AtlasButton>
      </div>
    </div>
  );
}

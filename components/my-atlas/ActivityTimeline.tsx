import EmptyState from "@/components/ui/EmptyState";
import type { JournalEntry } from "@/types/journal";

import ActivityPoster from "./ActivityPoster";
import {
  type ActivityItem,
  formatRating,
  formatShortActivityDate,
  groupActivityByMonth,
} from "./activity";

type ActivityTimelineProps = {
  items: ActivityItem[];
  journalEntries: JournalEntry[];
};

export default function ActivityTimeline({
  items,
  journalEntries,
}: ActivityTimelineProps) {
  const journalMovieIds = new Set(journalEntries.map((entry) => entry.movieId));
  const groups = groupActivityByMonth(items);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No activity yet."
        description="Your full cinema timeline will appear here after you watch films."
        actionLabel="Browse Movies"
        actionHref="/encyclopedia/movies"
      />
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((monthGroup) => (
        <section key={`${monthGroup.year}-${monthGroup.month}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {monthGroup.year}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {monthGroup.month}
          </h2>

          <div className="mt-5 space-y-5">
            {monthGroup.days.map((day) => (
              <div
                key={day.date}
                className="border-b border-white/10 pb-5 last:border-b-0"
              >
                <p className="text-sm font-medium text-neutral-300">
                  {formatShortActivityDate(day.date)}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  {day.items.map((item) => (
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
          </div>
        </section>
      ))}
    </div>
  );
}

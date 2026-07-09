import EmptyState from "@/components/ui/EmptyState";

import JournalCard from "./JournalCard";
import {
  type JournalViewItem,
  formatJournalDate,
  groupJournalByMonth,
} from "./journalUtils";

type JournalTimelineProps = {
  items: JournalViewItem[];
};

export default function JournalTimeline({ items }: JournalTimelineProps) {
  const groups = groupJournalByMonth(items);

  if (groups.length === 0) {
    return (
      <EmptyState
        preset="journal"
        title="No journal yet."
        description="Write your first journal after watching a film."
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
              <div key={day.date} className="space-y-3">
                <p className="text-sm font-medium text-neutral-300">
                  {formatJournalDate(day.date)}
                </p>

                <div className="space-y-3">
                  {day.items.map((item) => (
                    <JournalCard key={item.entry.id} item={item} />
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

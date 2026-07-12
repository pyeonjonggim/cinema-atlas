"use client";

import { useMemo, useState } from "react";

import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import type {
  PassportHistoryEvent,
  PassportHistoryEventType,
} from "@/types/passport";

type HistoryFilter = "all" | "challenges" | "achievements" | "milestones" | "journeys";

type PassportHistoryTimelineProps = {
  events: PassportHistoryEvent[];
};

const filters: Array<{ label: string; value: HistoryFilter }> = [
  { label: "All", value: "all" },
  { label: "Challenges", value: "challenges" },
  { label: "Achievements", value: "achievements" },
  { label: "Milestones", value: "milestones" },
  { label: "Journeys", value: "journeys" },
];

export default function PassportHistoryTimeline({
  events,
}: PassportHistoryTimelineProps) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const filteredEvents = useMemo(
    () => events.filter((event) => eventMatchesFilter(event.type, filter)),
    [events, filter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === item.value
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="space-y-6">
          {groupEvents(filteredEvents).map((group) => (
            <div key={group.key}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {group.label}
              </h3>
              <div className="mt-3 space-y-3">
                {group.events.map((event) => (
                  <AtlasCard key={event.id} href={event.href} className="rounded-2xl p-4">
                    <div className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-center">
                      <p className="text-sm text-neutral-500">{formatDate(event.date)}</p>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {event.type.replaceAll("_", " ")}
                        </p>
                        <h4 className="mt-1 font-semibold text-white">{event.title}</h4>
                        <p className="mt-1 text-sm text-neutral-400">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-neutral-300">
                        Open
                      </span>
                    </div>
                  </AtlasCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          preset="passport"
          title="No Passport history yet."
          description="Challenge, Achievement, Milestone, and Journey events will appear here."
        />
      )}
    </div>
  );
}

function eventMatchesFilter(type: PassportHistoryEventType, filter: HistoryFilter) {
  if (filter === "all") return true;
  if (filter === "challenges") return type.startsWith("challenge_");
  if (filter === "achievements") return type.startsWith("achievement_");
  if (filter === "milestones") return type.startsWith("milestone_");
  return type.startsWith("journey_");
}

function groupEvents(events: PassportHistoryEvent[]) {
  const groups = new Map<string, PassportHistoryEvent[]>();

  events.forEach((event) => {
    const key = event.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });

  return Array.from(groups.entries()).map(([key, groupedEvents]) => ({
    key,
    label: formatMonth(key),
    events: groupedEvents,
  }));
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  return `${year} / ${month}`;
}

function formatDate(value: string) {
  return value.slice(5);
}

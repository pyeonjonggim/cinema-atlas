"use client";

import { useMemo, useState } from "react";

import type { SavedJourneyRecord } from "@/types/journey";

const storageKey = "cinema-atlas:saved-journeys";
const savedJourneyChangedEvent = "cinema-atlas:saved-journeys-changed";

type SaveJourneyButtonProps = {
  journeyId: string;
  title: string;
};

export default function SaveJourneyButton({
  journeyId,
  title,
}: SaveJourneyButtonProps) {
  const [savedJourneys, setSavedJourneys] =
    useState<SavedJourneyRecord[]>(readSavedJourneys);
  const saved = useMemo(
    () => savedJourneys.some((record) => record.journeyId === journeyId),
    [journeyId, savedJourneys]
  );

  function toggleSaved() {
    const now = new Date().toISOString();
    const nextRecords = saved
      ? savedJourneys.filter((record) => record.journeyId !== journeyId)
      : [
          ...savedJourneys,
          {
            id: `saved_${journeyId}`,
            journeyId,
            status: "saved" as const,
            savedAt: now,
            updatedAt: now,
          },
        ];

    setSavedJourneys(nextRecords);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecords));
    window.dispatchEvent(new Event(savedJourneyChangedEvent));
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved journeys` : `Save ${title}`}
      onClick={toggleSaved}
      className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
    >
      {saved ? "Saved" : "Save Journey"}
    </button>
  );
}

function readSavedJourneys() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

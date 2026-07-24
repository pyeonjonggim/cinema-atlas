"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Journey, SavedJourneyRecord } from "@/types/journey";

const storageKey = "cinema-atlas:saved-journeys";
const savedJourneyChangedEvent = "cinema-atlas:saved-journeys-changed";

type SavedJourneySummary = Pick<
  Journey,
  | "id"
  | "title"
  | "subtitle"
  | "category"
  | "difficulty"
  | "estimatedMovies"
  | "estimatedHours"
>;

type SavedJourneyShelfProps = {
  journeys: SavedJourneySummary[];
  compact?: boolean;
};

export default function SavedJourneyShelf({
  journeys,
  compact = false,
}: SavedJourneyShelfProps) {
  const [savedRecords, setSavedRecords] =
    useState<SavedJourneyRecord[]>(readSavedJourneys);
  const savedJourneys = useMemo(() => {
    const journeyById = new Map(journeys.map((journey) => [journey.id, journey]));
    return savedRecords
      .map((record) => ({
        record,
        journey: journeyById.get(record.journeyId),
      }))
      .filter((item): item is { record: SavedJourneyRecord; journey: SavedJourneySummary } =>
        Boolean(item.journey)
      );
  }, [journeys, savedRecords]);

  useEffect(() => {
    function refreshSavedJourneys() {
      setSavedRecords(readSavedJourneys());
    }

    window.addEventListener("storage", refreshSavedJourneys);
    window.addEventListener(savedJourneyChangedEvent, refreshSavedJourneys);

    return () => {
      window.removeEventListener("storage", refreshSavedJourneys);
      window.removeEventListener(savedJourneyChangedEvent, refreshSavedJourneys);
    };
  }, []);

  function removeSavedJourney(journeyId: string) {
    const nextRecords = savedRecords.filter(
      (record) => record.journeyId !== journeyId
    );
    setSavedRecords(nextRecords);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRecords));
    window.dispatchEvent(new Event(savedJourneyChangedEvent));
  }

  if (savedJourneys.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-5">
        <p className="font-semibold text-white">No saved journeys yet.</p>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Save a Journey from its detail page and it will appear here as a path
          to return to later.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
      {savedJourneys.map(({ record, journey }) => (
        <article
          key={record.id}
          className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Saved Journey
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {journey.title}
              </h3>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
              {formatDifficulty(journey.difficulty)}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-400">
            {journey.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
            <span>{formatCategory(journey.category)}</span>
            <span>/</span>
            <span>{journey.estimatedMovies} films</span>
            <span>/</span>
            <span>{journey.estimatedHours}h</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Link
              href={`/explore/journeys/${journey.id}`}
              className="text-sm font-semibold text-neutral-300 transition hover:text-white"
            >
              Continue
            </Link>
            <button
              type="button"
              onClick={() => removeSavedJourney(journey.id)}
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
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

function formatDifficulty(difficulty: Journey["difficulty"]) {
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

function formatCategory(category: Journey["category"]) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

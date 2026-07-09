"use client";

import { useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

import JournalCard from "./JournalCard";
import { buildJournalItems } from "./journalUtils";

type JournalPreviewProps = {
  journalEntries: JournalEntry[];
  movies: Movie[];
  userMovies: UserMovie[];
  limit?: number;
};

export default function JournalPreview({
  journalEntries,
  movies,
  userMovies,
  limit = 6,
}: JournalPreviewProps) {
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const allJournalEntries = useMemo(
    () => mergeJournalEntries(journalEntries, localEntries),
    [journalEntries, localEntries]
  );
  const recentJournals = buildJournalItems({
    journalEntries: allJournalEntries,
    movies,
    userMovies,
  }).slice(0, limit);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocalEntries(readLocalJournalEntries());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (recentJournals.length === 0) {
    return (
      <EmptyState
        preset="journal"
        title="No journal yet."
        description="Write your first journal after watching a film."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {recentJournals.map((item) => (
        <JournalCard key={item.entry.id} item={item} />
      ))}
    </div>
  );
}

function readLocalJournalEntries(): JournalEntry[] {
  try {
    const rawEntries = window.localStorage.getItem("cinema-atlas:journalEntries");
    if (!rawEntries) return [];

    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function mergeJournalEntries(
  baseEntries: JournalEntry[],
  localEntries: JournalEntry[]
) {
  const entryMap = new Map<string, JournalEntry>();

  [...localEntries, ...baseEntries].forEach((entry) => {
    entryMap.set(entry.id, entry);
  });

  return Array.from(entryMap.values());
}

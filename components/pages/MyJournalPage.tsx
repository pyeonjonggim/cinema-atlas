"use client";

import { useEffect, useMemo, useState } from "react";

import JournalSearch from "@/components/journal/JournalSearch";
import JournalTimeline from "@/components/journal/JournalTimeline";
import { buildJournalItems } from "@/components/journal/journalUtils";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyJournalPageProps = {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export default function MyJournalPage({
  movies,
  userMovies,
  journalEntries,
}: MyJournalPageProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const allJournalEntries = useMemo(
    () => mergeJournalEntries(journalEntries, localEntries),
    [journalEntries, localEntries]
  );

  const journalItems = useMemo(
    () => buildJournalItems({ journalEntries: allJournalEntries, movies, userMovies }),
    [allJournalEntries, movies, userMovies]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return journalItems.filter((item) => {
      const { entry, movie, userMovie } = item;
      const searchableText = [
        entry.title,
        entry.body,
        entry.mood,
        entry.date,
        movie?.title,
        movie?.originalTitle,
        movie?.director,
        movie?.country,
        movie?.genre,
        ...(movie?.genres ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      const matchesFilter =
        filter === "All" ||
        (filter === "Spoiler" && entry.containsSpoilers) ||
        (filter === "Mood" && Boolean(entry.mood)) ||
        (filter === "Rating" &&
          typeof userMovie?.myRating === "number" &&
          userMovie.myRating > 0);

      return matchesQuery && matchesFilter;
    });
  }, [filter, journalItems, query]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocalEntries(readLocalJournalEntries());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <MyAtlasLayout>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          My Atlas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Journal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
          A private record of the thoughts and feelings that stayed with you
          after watching.
        </p>
      </section>

      <Section
        title="Journal Timeline"
        description="Search your reflections, then return to the films that shaped them."
        className="p-4 md:p-5"
      >
        <div className="space-y-6">
          <JournalSearch
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
          />
          <JournalTimeline items={filteredItems} />
        </div>
      </Section>

      <EntityContinueJourneyPattern
        title="Continue Exploring"
        description="A journal entry should quietly open the next path through cinema."
        items={[
          {
            label: "Activity",
            title: "Return to My Activity",
            description: "See the watching timeline that surrounds these notes.",
            href: "/my/activity",
            level: "primary",
          },
          {
            label: "Movies",
            title: "Browse the Encyclopedia",
            description: "Find another film and begin a new reflection.",
            href: "/encyclopedia/movies",
          },
          {
            label: "Explore",
            title: "Start a Curated Journey",
            description: "Move from memory back into discovery.",
            href: "/explore",
            level: "deep",
          },
        ]}
      />
    </MyAtlasLayout>
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

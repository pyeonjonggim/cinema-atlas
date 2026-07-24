"use client";

import { useMemo, useState } from "react";

import JourneyCard from "@/components/journey/JourneyCard";
import type {
  JourneyCategory,
  JourneyDifficulty,
  JourneyProjection,
} from "@/types/journey";

type JourneyLibraryProps = {
  journeys: JourneyProjection[];
};

type SourceFilter = "all" | "official" | "community";

export default function JourneyLibrary({ journeys }: JourneyLibraryProps) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<JourneyDifficulty | "all">("all");
  const [category, setCategory] = useState<JourneyCategory | "all">("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const categories = useMemo(
    () => Array.from(new Set(journeys.map((journey) => journey.category))).sort(),
    [journeys]
  );

  const filteredJourneys = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return journeys.filter((journey) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          journey.title,
          journey.subtitle,
          journey.description,
          journey.category,
          ...journey.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesDifficulty =
        difficulty === "all" || journey.difficulty === difficulty;
      const matchesCategory = category === "all" || journey.category === category;
      const matchesSource =
        source === "all" ||
        (source === "official" && journey.official) ||
        (source === "community" && !journey.official);

      return matchesQuery && matchesDifficulty && matchesCategory && matchesSource;
    });
  }, [category, difficulty, journeys, query, source]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search journeys..."
          className="h-11 rounded-full border border-white/10 bg-black/30 px-5 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/25"
        />

        <JourneySelect
          label="Difficulty"
          value={difficulty}
          onChange={(value) => setDifficulty(value as JourneyDifficulty | "all")}
          options={[
            ["all", "All Difficulty"],
            ["beginner", "Beginner"],
            ["intermediate", "Intermediate"],
            ["advanced", "Advanced"],
          ]}
        />

        <JourneySelect
          label="Category"
          value={category}
          onChange={(value) => setCategory(value as JourneyCategory | "all")}
          options={[
            ["all", "All Categories"],
            ...categories.map((item) => [item, formatCategory(item)] as const),
          ]}
        />

        <JourneySelect
          label="Source"
          value={source}
          onChange={(value) => setSource(value as SourceFilter)}
          options={[
            ["all", "All Sources"],
            ["official", "Official"],
            ["community", "Community"],
          ]}
        />
      </div>

      {source === "community" ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-5">
          <p className="font-semibold text-white">Community Journeys are coming later.</p>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            The domain supports future community authorship, visibility, likes,
            and followers, but this Sprint intentionally exposes only official
            Cinema Atlas Journeys.
          </p>
        </div>
      ) : filteredJourneys.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredJourneys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} steps={journey.steps} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p className="font-semibold text-white">No Journeys found.</p>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Try a broader search or reset the filters.
          </p>
        </div>
      )}
    </div>
  );
}

function JourneySelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-full border border-white/10 bg-black/30 px-4 text-sm text-neutral-300 outline-none focus:border-white/25"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

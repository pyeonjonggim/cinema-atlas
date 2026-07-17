"use client";

import SearchResultRow from "@/components/search/SearchResultRow";
import type { SearchEntityType, UnifiedSearchResult } from "@/lib/search";

const sectionLabels: Record<SearchEntityType, string> = {
  movie: "Movies",
  director: "Directors",
  actor: "Actors",
  country: "Countries",
  movement: "Movements",
  award: "Awards",
};

type SearchSectionProps = {
  entityType: SearchEntityType;
  results: UnifiedSearchResult[];
  onNavigate?: (result: UnifiedSearchResult) => void;
};

export default function SearchSection({ entityType, results, onNavigate }: SearchSectionProps) {
  if (results.length === 0) return null;

  return (
    <section className="border-t border-[var(--atlas-border)] pt-3">
      <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-accent)]">
        {sectionLabels[entityType]}
      </h3>
      <div className="space-y-1">
        {results.map((result) => (
          <SearchResultRow
            key={`${result.entityType}:${result.slug}`}
            result={result}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}


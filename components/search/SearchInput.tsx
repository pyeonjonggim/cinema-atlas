"use client";

import { useState } from "react";

type SearchInputProps = {
  initialQuery?: string;
  selectedType?: string;
};

export default function SearchInput({ initialQuery = "", selectedType = "all" }: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form action="/search" method="get" className="flex flex-col gap-3 md:flex-row">
      <label className="sr-only" htmlFor="search-query">
        Search Cinema Atlas
      </label>
      {selectedType !== "all" && (
        <input type="hidden" name="type" value={selectedType} />
      )}
      <input
        id="search-query"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search movies, directors, actors, countries, movements, and awards."
        autoFocus
        className="min-h-12 flex-1 rounded-full border border-[var(--atlas-border)] bg-black/30 px-5 text-sm text-[var(--atlas-text)] outline-none transition placeholder:text-[var(--atlas-text-subtle)] focus:border-[var(--atlas-accent)]"
      />
      <button
        type="submit"
        className="min-h-12 rounded-full bg-[var(--atlas-accent)] px-6 text-sm font-semibold text-black transition hover:bg-[var(--atlas-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--atlas-accent)] focus:ring-offset-2 focus:ring-offset-black"
      >
        Search
      </button>
    </form>
  );
}

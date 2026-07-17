"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { searchOverlayCatalog } from "@/app/search/actions";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchSection from "@/components/search/SearchSection";
import type { SearchEntityType, UnifiedSearchResult } from "@/lib/search";

const entityOrder: SearchEntityType[] = ["movie", "director", "actor", "country", "movement", "award"];
const popularSearches = ["Parasite", "Seven Samurai", "In the Mood for Love", "French New Wave", "Japan"];
const recentStorageKey = "cinema-atlas:recent-searches";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function groupResults(results: UnifiedSearchResult[]) {
  return entityOrder.reduce<Record<SearchEntityType, UnifiedSearchResult[]>>((groups, entityType) => {
    groups[entityType] = results.filter((result) => result.entityType === entityType);
    return groups;
  }, {
    movie: [],
    director: [],
    actor: [],
    country: [],
    movement: [],
    award: [],
  });
}

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function writeRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed || typeof window === "undefined") return;
  const next = [trimmed, ...readRecentSearches().filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
  window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const groupedResults = useMemo(() => groupResults(results), [results]);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => {
      setRecent(readRecentSearches());
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !panelRef.current?.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (trimmedQuery.length < 2) {
      const resetTimer = window.setTimeout(() => setResults([]), 0);
      return () => window.clearTimeout(resetTimer);
    }

    let active = true;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const nextResults = await searchOverlayCatalog(trimmedQuery);
        if (active) setResults(nextResults);
      });
    }, 120);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, trimmedQuery]);

  function selectQuery(nextQuery: string) {
    setQuery(nextQuery);
    inputRef.current?.focus();
  }

  function handleNavigate(result?: UnifiedSearchResult) {
    writeRecentSearch(result?.title ?? trimmedQuery);
    setRecent(readRecentSearches());
    onClose();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Cinema Atlas"
      className="fixed inset-0 z-[100] px-4 py-16"
    >
      <button
        type="button"
        aria-label="Close search backdrop"
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
        onPointerDown={onClose}
      />

      <div
        ref={panelRef}
        className="relative z-10 mx-auto max-w-3xl animate-[searchOverlayIn_180ms_ease-out] overflow-hidden rounded-[var(--atlas-radius-feature)] border border-[var(--atlas-border-strong)] bg-[var(--atlas-bg-elevated)] shadow-2xl shadow-black/50"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--atlas-border)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-accent)]">
                Search Cinema Atlas
              </p>
              <p className="mt-1 text-sm text-[var(--atlas-text-muted)]">
                Movies, people, countries, movements, and awards.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="rounded-full border border-[var(--atlas-border)] px-3 py-1.5 text-xs text-[var(--atlas-text-muted)] transition hover:border-[var(--atlas-border-strong)] hover:text-[var(--atlas-text)]"
            >
              Cancel
            </button>
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a title, name, country, movement, or award."
            aria-label="Search Cinema Atlas"
            className="h-12 w-full rounded-full border border-[var(--atlas-border)] bg-black/40 px-5 text-base text-[var(--atlas-text)] outline-none transition placeholder:text-[var(--atlas-text-subtle)] focus:border-[var(--atlas-accent)]"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {trimmedQuery.length < 2 && (
            <SearchEmptyState recent={recent} popular={popularSearches} onSelect={selectQuery} />
          )}

          {trimmedQuery.length >= 2 && results.length === 0 && !isPending && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-semibold text-[var(--atlas-text)]">
                No results found for &quot;{trimmedQuery}&quot;.
              </p>
              <p className="mt-2 text-sm text-[var(--atlas-text-muted)]">
                Try another title, name, country, movement, or award.
              </p>
            </div>
          )}

          {trimmedQuery.length >= 2 && (
            <div className="space-y-4">
              {entityOrder.map((entityType) => (
                <SearchSection
                  key={entityType}
                  entityType={entityType}
                  results={groupedResults[entityType]}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[var(--atlas-border)] px-5 py-4 text-sm text-[var(--atlas-text-muted)]">
          <span>{isPending ? "Searching..." : "Esc to close"}</span>
          {trimmedQuery.length >= 2 && (
            <Link
              href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
              onClick={() => handleNavigate()}
              className="font-semibold text-[var(--atlas-accent)] transition hover:text-[var(--atlas-accent-hover)]"
            >
              View all results
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

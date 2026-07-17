"use client";

import Link from "next/link";
import type { UnifiedSearchResult } from "@/lib/search";

const entityLabels: Record<UnifiedSearchResult["entityType"], string> = {
  movie: "Movie",
  director: "Director",
  actor: "Actor",
  country: "Country",
  movement: "Movement",
  award: "Award",
};

type SearchResultRowProps = {
  result: UnifiedSearchResult;
  onNavigate?: (result: UnifiedSearchResult) => void;
};

export default function SearchResultRow({ result, onNavigate }: SearchResultRowProps) {
  return (
    <Link
      href={result.href}
      onClick={() => onNavigate?.(result)}
      className="block rounded-lg px-3 py-2 transition hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--atlas-text)]">
            {result.title}
          </p>
          <p className="mt-0.5 text-xs text-[var(--atlas-text-subtle)]">
            {entityLabels[result.entityType]}
            {result.subtitle ? ` · ${result.subtitle}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-xs text-[var(--atlas-text-subtle)]">
          Open
        </span>
      </div>
    </Link>
  );
}


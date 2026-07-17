"use client";

type SearchEmptyStateProps = {
  recent: string[];
  popular: string[];
  onSelect: (query: string) => void;
};

export default function SearchEmptyState({ recent, popular, onSelect }: SearchEmptyStateProps) {
  const startingPoints = recent.length > 0 ? recent : popular;
  const title = recent.length > 0 ? "Recent" : "Popular";

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-accent)]">
          Continue Exploring
        </p>
        <p className="text-sm leading-6 text-[var(--atlas-text-muted)]">
          Search from any point in Cinema Atlas: a film, filmmaker, performer, country, movement, or award.
        </p>
      </div>

      <div className="border-t border-[var(--atlas-border)] pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--atlas-text-subtle)]">
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {startingPoints.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className="rounded-full border border-[var(--atlas-border)] px-3 py-1.5 text-sm text-[var(--atlas-text-muted)] transition hover:border-[var(--atlas-border-strong)] hover:text-[var(--atlas-text)]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


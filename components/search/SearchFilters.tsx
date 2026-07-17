import Link from "next/link";
import type { SearchEntityType } from "@/lib/search";

const filters: Array<{ label: string; value: "all" | SearchEntityType }> = [
  { label: "All", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "Directors", value: "director" },
  { label: "Actors", value: "actor" },
  { label: "Countries", value: "country" },
  { label: "Movements", value: "movement" },
  { label: "Awards", value: "award" },
];

type SearchFiltersProps = {
  query: string;
  selectedType: string;
};

export default function SearchFilters({ query, selectedType }: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Search result filters">
      {filters.map((filter) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (filter.value !== "all") params.set("type", filter.value);
        const active = selectedType === filter.value || (!selectedType && filter.value === "all");

        return (
          <Link
            key={filter.value}
            href={`/search${params.toString() ? `?${params.toString()}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-[var(--atlas-accent)] bg-[var(--atlas-accent-soft)] text-[var(--atlas-text)]"
                : "border-[var(--atlas-border)] bg-white/[0.03] text-[var(--atlas-text-muted)] hover:border-[var(--atlas-border-strong)] hover:text-[var(--atlas-text)]"
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}


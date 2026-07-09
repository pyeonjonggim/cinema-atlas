"use client";

type JournalSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
};

const filters = ["All", "Spoiler", "Mood", "Rating"];

export default function JournalSearch({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: JournalSearchProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search journals, films, themes..."
        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/25 lg:max-w-xl"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilterChange(item)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === item
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

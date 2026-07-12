"use client";

import { useMemo, useState } from "react";

import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import type {
  ExplorerCountryProgress,
  ExplorerProgressStatus,
} from "@/types/passport";

type ExplorerCountryBoardProps = {
  countries: ExplorerCountryProgress[];
};

type BoardFilter = "all" | "explored" | "unexplored";
type SortMode = "most-watched" | "highest-progress" | "recently-watched" | "country-name";

export default function ExplorerCountryBoard({
  countries,
}: ExplorerCountryBoardProps) {
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState<ExplorerProgressStatus | "all">("all");
  const [sort, setSort] = useState<SortMode>("most-watched");
  const regions = useMemo(
    () => Array.from(new Set(countries.map((country) => country.regionId))).sort(),
    [countries]
  );
  const visibleCountries = useMemo(() => {
    return countries
      .filter((country) => {
        if (filter === "explored" && country.watchedCount === 0) return false;
        if (filter === "unexplored" && country.watchedCount > 0) return false;
        if (region !== "all" && country.regionId !== region) return false;
        if (status !== "all" && country.status !== status) return false;
        return true;
      })
      .sort((a, b) => sortCountries(a, b, sort));
  }, [countries, filter, region, status, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "explored", "unexplored"] as BoardFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={filterButtonClass(filter === item)}
          >
            {formatLabel(item)}
          </button>
        ))}

        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-neutral-300"
        >
          <option value="all">All Regions</option>
          {regions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ExplorerProgressStatus | "all")
          }
          className="rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-neutral-300"
        >
          <option value="all">All Status</option>
          <option value="unexplored">Unexplored</option>
          <option value="started">Started</option>
          <option value="exploring">Exploring</option>
          <option value="established">Established</option>
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortMode)}
          className="rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-neutral-300"
        >
          <option value="most-watched">Most Watched</option>
          <option value="highest-progress">Highest Catalog Progress</option>
          <option value="recently-watched">Recently Watched</option>
          <option value="country-name">Country Name</option>
        </select>
      </div>

      {visibleCountries.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCountries.map((country) => (
            <AtlasCard
              key={country.countryId}
              href={`/encyclopedia/countries/${country.countryId}`}
              className="rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {country.status}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {country.countryName}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{country.regionId}</p>
                </div>
                {country.flag && <span className="text-xl">{country.flag}</span>}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Films" value={String(country.watchedCount)} />
                <Metric label="Directors" value={String(country.directorCount)} />
                <Metric label="Decades" value={String(country.decadeCount)} />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
                <span>Known catalog</span>
                <span>
                  {country.watchedCount} / {country.totalKnownMovies}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/40"
                  style={{ width: `${country.progressPercent}%` }}
                />
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                Last watched: {country.lastWatchedAt ?? "Not yet"}
              </p>
              <p className="mt-4 text-sm font-medium text-neutral-300">
                View Country Encyclopedia
              </p>
            </AtlasCard>
          ))}
        </div>
      ) : (
        <EmptyState
          preset="passport"
          title="No countries match this view."
          description="Try another filter or return to all countries."
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function sortCountries(
  left: ExplorerCountryProgress,
  right: ExplorerCountryProgress,
  sort: SortMode
) {
  if (sort === "highest-progress") {
    return right.progressPercent - left.progressPercent;
  }
  if (sort === "recently-watched") {
    return (right.lastWatchedAt ?? "").localeCompare(left.lastWatchedAt ?? "");
  }
  if (sort === "country-name") {
    return left.countryName.localeCompare(right.countryName);
  }
  return right.watchedCount - left.watchedCount;
}

function filterButtonClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-semibold transition ${
    active
      ? "border-white/20 bg-white/10 text-white"
      : "border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
  }`;
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

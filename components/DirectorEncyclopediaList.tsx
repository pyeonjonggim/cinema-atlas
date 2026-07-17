"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EntityCardVisual from "@/components/entity/EntityCardVisual";
import ListHero, { type ListHeroProps } from "@/components/layout/ListHero";
import AtlasButton from "@/components/ui/AtlasButton";
import EmptyState from "@/components/ui/EmptyState";
import { useTwoRowLimit } from "@/components/useTwoRowLimit";
import type { EntityImage } from "@/lib/media";

export type DirectorEncyclopediaItem = {
  slug: string;
  name: string;
  nameKo?: string;
  country?: string;
  countryFlag?: string;
  description?: string;
  styleKeywords?: string[];
  relatedMovieCount?: number;
  essentialMovieCount?: number;
  profileImage?: EntityImage | null;
};

type DirectorEncyclopediaListProps = {
  directors: DirectorEncyclopediaItem[];
  hero: Pick<
    ListHeroProps,
    "eyebrow" | "title" | "description" | "searchPlaceholder" | "totalLabel"
  >;
};

const filterOptions = ["Country", "Era", "Movement"];
const sortOptions = ["A-Z", "Popularity", "Recently Added"];

function DirectorCard({ director }: { director: DirectorEncyclopediaItem }) {
  return (
    <Link href={`/encyclopedia/directors/${director.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20">
        <EntityCardVisual
          label="DIRECTOR"
          entityImage={director.profileImage}
          imageAlt={director.name}
          tone="person"
        />
        <div className="p-2.5">
          <h2 className="line-clamp-1 text-sm font-semibold text-white">
            {director.name}
          </h2>

          <p className="mt-1 text-xs text-neutral-500">
            {director.country ?? "Director"}
          </p>

          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
            {director.nameKo ?? "Film Director"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function DirectorEncyclopediaList({
  directors,
  hero,
}: DirectorEncyclopediaListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(sortOptions[0]);

  const filteredDirectors = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const result = directors.filter((director) => {
      if (!keyword) return true;

      const searchText = `${director.name} ${director.nameKo ?? ""} ${
        director.country ?? ""
      } ${(director.styleKeywords ?? []).join(" ")}`.toLowerCase();

      return searchText.includes(keyword);
    });

    if (sort === "A-Z") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [directors, query, sort]);
  const {
    visibleItems: visibleDirectors,
    isExpanded,
    canExpand,
    remainingCount,
    showAll,
    collapse,
  } = useTwoRowLimit(filteredDirectors, `${query}|${sort}|${filteredDirectors.length}`);

  return (
    <div className="space-y-6">
      <ListHero {...hero} searchValue={query} onSearchChange={setQuery} />

      <section className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {filterOptions.map((filter) => (
              <AtlasButton key={filter} variant="secondary">
                {filter}
              </AtlasButton>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-white/10 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 outline-none focus:border-white/25"
            >
              {sortOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-medium text-white">{directors.length} Directors</p>

          <p className="text-neutral-500">
            Showing {filteredDirectors.length} result
            {filteredDirectors.length === 1 ? "" : "s"}
          </p>
        </div>

        {filteredDirectors.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
              {visibleDirectors.map((director) => (
                <DirectorCard key={director.slug} director={director} />
              ))}
            </div>

            {canExpand && (
              <div className="flex justify-center pt-2">
                <AtlasButton variant="secondary" onClick={isExpanded ? collapse : showAll}>
                  {isExpanded ? "Show less" : `View more (${remainingCount})`}
                </AtlasButton>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            preset="search"
            title="No directors found."
            description="Try a different name, country, movement, or style keyword."
          />
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EntityCardVisual from "@/components/entity/EntityCardVisual";
import ListHero, { type ListHeroProps } from "@/components/layout/ListHero";
import AtlasButton from "@/components/ui/AtlasButton";
import EmptyState from "@/components/ui/EmptyState";

export type ActorEncyclopediaItem = {
  slug: string;
  name: string;
  nameKo?: string;
  country?: string;
  countryFlag?: string;
  description?: string;
  screenPersona?: string[];
  relatedMovieCount?: number;
};

type ActorEncyclopediaListProps = {
  actors: ActorEncyclopediaItem[];
  hero: Pick<
    ListHeroProps,
    "eyebrow" | "title" | "description" | "searchPlaceholder" | "totalLabel"
  >;
};

const filterOptions = ["Country", "Era", "Gender"];
const sortOptions = ["A-Z", "Popularity", "Recently Added"];

function ActorCard({ actor }: { actor: ActorEncyclopediaItem }) {
  return (
    <Link href={`/encyclopedia/actors/${actor.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20">
        <EntityCardVisual label="ACTOR" tone="person" />

        <div className="p-2.5">
          <h2 className="line-clamp-1 text-sm font-semibold text-white">
            {actor.name}
          </h2>

          <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
            {actor.country ?? "Actor"}
          </p>

          {actor.screenPersona && actor.screenPersona.length > 0 ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
              {actor.screenPersona[0]}
            </p>
          ) : (
            actor.nameKo && (
              <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                {actor.nameKo}
              </p>
            )
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ActorEncyclopediaList({
  actors,
  hero,
}: ActorEncyclopediaListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(sortOptions[0]);

  const filteredActors = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    const result = actors.filter((actor) => {
      if (!keyword) return true;

      const searchText = `${actor.name} ${actor.nameKo ?? ""} ${
        actor.country ?? ""
      } ${(actor.screenPersona ?? []).join(" ")}`.toLowerCase();

      return searchText.includes(keyword);
    });

    if (sort === "A-Z") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [actors, query, sort]);

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
          <p className="font-medium text-white">{actors.length} Actors</p>

          <p className="text-neutral-500">
            Showing {filteredActors.length} result
            {filteredActors.length === 1 ? "" : "s"}
          </p>
        </div>

        {filteredActors.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
            {filteredActors.map((actor) => (
              <ActorCard key={actor.slug} actor={actor} />
            ))}
          </div>
        ) : (
          <EmptyState
            preset="search"
            title="No actors found."
            description="Try a different actor, country, era, or screen persona."
          />
        )}
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import MovieCard from "@/components/MovieCard";
import AtlasButton from "@/components/ui/AtlasButton";
import EmptyState from "@/components/ui/EmptyState";

import type { Movie } from "@/types/movie";

type MovieListProps = {
  movies: Movie[];
};

const filterOptions = ["Genre", "Country", "Year", "Language"];
const sortOptions = ["Popularity", "A–Z", "Release Year", "Rating"];

export default function MovieList({ movies }: MovieListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortOptions[0]);

  const filteredMovies = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = movies.filter((movie) => {
      if (!keyword) return true;

      return (
        movie.title.toLowerCase().includes(keyword) ||
        movie.originalTitle.toLowerCase().includes(keyword) ||
        movie.director.toLowerCase().includes(keyword) ||
        movie.country.toLowerCase().includes(keyword) ||
        movie.movement.toLowerCase().includes(keyword) ||
        movie.genre.toLowerCase().includes(keyword)
      );
    });

    if (sort === "A–Z") {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sort === "Release Year") {
      return [...result].sort((a, b) => b.year - a.year);
    }

    if (sort === "Rating") {
      return [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [movies, search, sort]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <AtlasButton key={filter} variant="secondary">
              {filter} ▾
            </AtlasButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search movies..."
            className="w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/25 lg:w-72"
          />

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
        <p className="font-medium text-white">{movies.length} Movies</p>

        <p className="text-neutral-500">
          Showing {filteredMovies.length} result
          {filteredMovies.length === 1 ? "" : "s"}
        </p>
      </div>

      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <EmptyState
          preset="search"
          title="No movies found."
          description="Try a different title, director, country, genre, or movement."
        />
      )}
    </section>
  );
}
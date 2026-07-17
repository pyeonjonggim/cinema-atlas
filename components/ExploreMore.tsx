"use client";

import { useState } from "react";
import ConnectedTo from "@/components/ConnectedTo";
import type { Movie } from "@/types/movie";

type ExploreMoreProps = {
  movie: Movie;
};

export default function ExploreMore({ movie }: ExploreMoreProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-zinc-600 hover:bg-zinc-800"
      >
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
          Explore More
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {isOpen ? "Close Details" : "Explore More"}
        </h2>

        <p className="mt-3 text-zinc-400">
          Explore the connected countries, directors, actors, and movements in more detail.
        </p>
      </button>

      {isOpen && (
        <div className="mt-6">
          <ConnectedTo
            country={movie.country}
            countrySlug={movie.countrySlug}
            director={movie.director}
            directorSlug={movie.directorSlug}
            movement={movie.movement}
            movementSlug={movie.movementSlug}
            mainActor={movie.actors[0]}
            mainActorSlug={movie.actorSlugs[0]}
            award={movie.awards?.[0]}
            awardSlug={movie.awardSlugs?.[0]}
          />
        </div>
      )}
    </section>
  );
}


import Image from "next/image";
import Link from "next/link";

import type { Movie } from "@/types/movie";

import Section from "../layout/Section";

type EntityStartingPointPatternProps = {
  movie?: Movie;
  reason?: string;
  fallbackMessage?: string;
};

export default function EntityStartingPointPattern({
  movie,
  reason,
  fallbackMessage = "A recommended starting point has not been selected yet.",
}: EntityStartingPointPatternProps) {
  return (
    <Section
      title="Recommended Starting Point"
      description="A clear first step into this cinematic world."
      className="p-4 md:p-5"
    >
      {movie ? (
        <Link
          href={`/movies/${movie.id}`}
          className="group grid gap-4 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 transition hover:border-amber-200/40 hover:bg-amber-300/[0.12] md:grid-cols-[92px_1fr]"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-neutral-900">
            {movie.poster ? (
              <Image
                src={movie.poster}
                alt={`${movie.title} poster`}
                fill
                sizes="92px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_40%_18%,rgba(251,191,36,0.22),transparent_28%),linear-gradient(160deg,rgba(41,37,36,0.95),rgba(10,10,10,1))]" />
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              Start Here
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {movie.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              {movie.originalTitle} / {movie.year} / {movie.runtime} min
            </p>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-300">
              {reason ??
                "This film is a strong entry point into the entity's wider cinematic context."}
            </p>
            <p className="mt-4 text-sm font-medium text-neutral-200 transition group-hover:text-white">
              Explore Film
            </p>
          </div>
        </Link>
      ) : (
        <p className="text-sm text-neutral-400">{fallbackMessage}</p>
      )}
    </Section>
  );
}

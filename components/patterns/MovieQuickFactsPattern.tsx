import Link from "next/link";

import Section from "../layout/Section";
import type { Movie } from "@/types/movie";

type MovieQuickFactsPatternProps = {
  movie: Movie;
};

export default function MovieQuickFactsPattern({
  movie,
}: MovieQuickFactsPatternProps) {
  const facts = [
    {
      label: "Year",
      value: movie.year,
    },
    {
      label: "Runtime",
      value: `${movie.runtime} min`,
    },
    {
      label: "Country",
      value: movie.country,
    },
    {
      label: "Language",
      value: movie.language ?? "Not specified",
    },
    {
      label: "Director",
      value: movie.director,
    },
    {
      label: "Movement",
      value: movie.movement,
    },
    {
      label: "Awards",
      value: movie.awards.length > 0 ? movie.awards.join(", ") : "Not listed",
    },
  ];

  return (
    <Section
      title="Quick Facts"
      description="Essential context before continuing deeper into the film."
      className="p-4 md:p-5"
      action={
        <Link
          href={`/encyclopedia/directors/${movie.directorSlug}`}
          className="text-sm font-medium text-neutral-400 transition hover:text-white"
        >
          Explore Director
        </Link>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              {fact.label}
            </p>

            <p className="mt-1 line-clamp-1 text-sm font-medium text-white">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

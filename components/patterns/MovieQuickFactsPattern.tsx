import Link from "next/link";

import QuickFacts, { QuickFactItem } from "../entity/QuickFacts";
import Section from "../layout/Section";
import type { Movie } from "@/types/movie";

type MovieQuickFactsPatternProps = {
  movie: Movie;
};

export default function MovieQuickFactsPattern({
  movie,
}: MovieQuickFactsPatternProps) {
  const facts: QuickFactItem[] = [
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
      action={
        <Link
          href={`/encyclopedia/directors/${movie.directorSlug}`}
          className="text-sm font-medium text-neutral-400 transition hover:text-white"
        >
          Explore Director
        </Link>
      }
    >
      <QuickFacts facts={facts} />
    </Section>
  );
}

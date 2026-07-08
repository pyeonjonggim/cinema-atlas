import Link from "next/link";

import EntityQuickFactsPattern, {
  type EntityQuickFact,
} from "./EntityQuickFactsPattern";
import type { Movie } from "@/types/movie";

type MovieQuickFactsPatternProps = {
  movie: Movie;
};

export default function MovieQuickFactsPattern({
  movie,
}: MovieQuickFactsPatternProps) {
  const facts: EntityQuickFact[] = [
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
    <EntityQuickFactsPattern
      facts={facts}
      description="Essential context before continuing deeper into the film."
      action={
        <Link
          href={`/encyclopedia/directors/${movie.directorSlug}`}
          className="text-sm font-medium text-neutral-400 transition hover:text-white"
        >
          Explore Director
        </Link>
      }
    />
  );
}

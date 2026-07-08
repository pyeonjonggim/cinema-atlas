import type { Movie } from "@/types/movie";

type MovieFactsProps = {
  movie: Movie;
};

export default function MovieFacts({ movie }: MovieFactsProps) {
  const difficultyLabel =
    movie.difficulty === "beginner"
      ? "Beginner"
      : movie.difficulty === "intermediate"
        ? "Intermediate"
        : "Advanced";

  return (
    <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Quick Facts
      </p>

      <div className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
        <Fact label="Director" value={movie.director} />
        <Fact
          label="Rating"
          value={movie.rating ? `★ ${movie.rating}` : "Not rated"}
        />
        <Fact label="Genre" value={movie.genre} />
        <Fact
          label="Runtime"
          value={movie.runtime ? `${movie.runtime} min` : "Unknown"}
        />
        <Fact label="Difficulty" value={difficultyLabel} />
        <Fact label="Awards" value={movie.awards?.join(" · ") ?? "None"} />
      </div>
    </section>
  );
}

type FactProps = {
  label: string;
  value: string;
};

function Fact({ label, value }: FactProps) {
  return (
    <div className="flex border-b border-zinc-800 pb-3">
      <p className="w-28 shrink-0 text-sm text-zinc-500">{label}</p>
      <p className="font-semibold text-zinc-200">{value}</p>
    </div>
  );
}
import Link from "next/link";

import EntityCardVisual from "@/components/entity/EntityCardVisual";
import type { Movie } from "@/types/movie";

type MovieCardProps = {
  movie: Movie;
};

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20">
        <EntityCardVisual
          label="MOVIE"
          entityImage={movie.posterImage}
          image={movie.poster}
          imageAlt={movie.title}
          tone="movie"
        />

        <div className="p-2.5">
          <h2 className="line-clamp-1 text-sm font-semibold text-white">
            {movie.title}
          </h2>

          <p className="mt-1 text-xs text-neutral-500">{movie.year}</p>

          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
            {movie.country}
          </p>
        </div>
      </div>
    </Link>
  );
}

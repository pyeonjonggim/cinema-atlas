import Image from "next/image";
import Link from "next/link";

import type { Movie } from "@/types/movie";

type MovieCardProps = {
  movie: Movie;
};

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 14vw, (min-width: 768px) 20vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Movie
            </p>
          </div>
        </div>

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

import Image from "next/image";

import type { Movie } from "@/types/movie";

type CollectionCoverProps = {
  movies: Movie[];
  compact?: boolean;
};

export default function CollectionCover({
  movies,
  compact = false,
}: CollectionCoverProps) {
  const coverMovies = movies.slice(0, 4);

  return (
    <div
      className={`grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 ${
        compact ? "h-28" : "aspect-[4/3]"
      }`}
    >
      {Array.from({ length: 4 }).map((_, index) => {
        const movie = coverMovies[index];

        return (
          <div key={movie?.id ?? index} className="relative bg-neutral-900">
            {movie?.poster ? (
              <Image
                src={movie.poster}
                alt={movie.title}
                fill
                sizes="120px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

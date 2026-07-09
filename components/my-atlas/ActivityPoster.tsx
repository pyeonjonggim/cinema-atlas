import Image from "next/image";
import Link from "next/link";

import type { Movie } from "@/types/movie";

type ActivityPosterProps = {
  movie?: Movie;
  ratingLabel: string;
  hasJournal?: boolean;
};

export default function ActivityPoster({
  movie,
  ratingLabel,
  hasJournal = false,
}: ActivityPosterProps) {
  const content = (
    <div className="group w-20 shrink-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        {movie?.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="80px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
        )}

        {hasJournal && (
          <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/70" />
        )}
      </div>

      <p className="mt-2 line-clamp-1 text-center text-xs text-neutral-400">
        {ratingLabel}
      </p>
    </div>
  );

  if (!movie) return content;

  return (
    <Link href={`/movies/${movie.id}`} className="block">
      {content}
    </Link>
  );
}

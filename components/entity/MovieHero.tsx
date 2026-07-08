import Image from "next/image";

import AtlasBadge from "../ui/AtlasBadge";
import AtlasTag from "../ui/AtlasTag";
import type { Movie } from "@/types/movie";

type MovieHeroProps = {
  movie: Movie;
};

export default function MovieHero({ movie }: MovieHeroProps) {
  const genres = movie.genres ?? movie.genre.split("/").map((item) => item.trim());

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-950">
      <div className="absolute inset-0">
        {movie.backdrop || movie.poster ? (
          <Image
            src={movie.backdrop ?? movie.poster}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-20 blur-sm"
            priority
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,rgba(39,39,42,0.8),rgba(9,9,11,1))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/88 to-neutral-950/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      </div>

      <div className="relative grid gap-5 p-5 md:grid-cols-[132px_1fr] md:p-6 lg:grid-cols-[148px_1fr]">
        <div className="relative w-28 overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl shadow-black/40 md:w-full">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              width={296}
              height={444}
              sizes="(min-width: 1024px) 148px, (min-width: 768px) 132px, 112px"
              className="aspect-[2/3] h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-xs text-neutral-500">
              No Poster
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
            Movie Encyclopedia
          </p>

          <h1 className="mt-2 text-4xl font-bold leading-tight text-white md:text-5xl">
            {movie.title}
          </h1>

          <p className="mt-1 text-base text-neutral-400">{movie.originalTitle}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <AtlasBadge label={`${movie.year}`} />
            <AtlasBadge label={`${movie.runtime} min`} />
            <AtlasBadge label={`Average ${movie.rating.toFixed(1)}`} />
            {genres.map((genre) => (
              <AtlasTag key={genre}>{genre}</AtlasTag>
            ))}
          </div>

          <div className="mt-5 grid gap-3 text-sm text-neutral-300 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Director
              </p>
              <p className="mt-1 font-medium text-white">{movie.director}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Country
              </p>
              <p className="mt-1 font-medium text-white">{movie.country}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Movement
              </p>
              <p className="mt-1 font-medium text-white">{movie.movement}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

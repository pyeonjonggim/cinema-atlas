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
    <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[160px_1fr] md:p-6">
      <div className="relative w-32 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 md:w-full">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            width={320}
            height={480}
            sizes="(min-width: 768px) 160px, 128px"
            className="aspect-[2/3] h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center text-xs text-neutral-500">
            No Poster
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-sm uppercase tracking-[0.22em] text-neutral-500">
          Movie Encyclopedia
        </p>

        <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
          {movie.title}
        </h1>

        <p className="mt-2 text-lg text-neutral-400">{movie.originalTitle}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <AtlasBadge label={`${movie.year}`} />
          <AtlasBadge label={`${movie.runtime} min`} />
          {genres.map((genre) => (
            <AtlasTag key={genre}>{genre}</AtlasTag>
          ))}
        </div>
      </div>
    </section>
  );
}

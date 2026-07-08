import Link from "next/link";
import type { Movie } from "@/types/movie";

type AtlasPositionProps = {
  movie: Movie;
};

export default function AtlasPosition({ movie }: AtlasPositionProps) {
  return (
    <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
        Atlas Position
      </p>

      <h2 className="mt-3 text-3xl font-bold">📍 You Are Here</h2>

      <div className="mt-8 flex flex-col gap-4">
        <Link
          href={`/encyclopedia/countries/${movie.countrySlug}`}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          <p className="text-3xl">{movie.countryFlag}</p>
          <h3 className="mt-2 text-2xl font-bold">{movie.country}</h3>
          <p className="mt-1 text-zinc-400">Country encyclopedia</p>
        </Link>

        <div className="flex justify-center text-3xl text-zinc-600">│</div>

        <Link
          href={`/encyclopedia/movements/${movie.movementSlug}`}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          <p className="text-3xl">📚</p>
          <h3 className="mt-2 text-2xl font-bold">{movie.movement}</h3>
          <p className="mt-1 text-zinc-400">Film Movement</p>
        </Link>

        <div className="flex justify-center text-3xl text-zinc-600">│</div>

        <Link
          href={`/encyclopedia/directors/${movie.directorSlug}`}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          <p className="text-3xl">🎥</p>
          <h3 className="mt-2 text-2xl font-bold">{movie.director}</h3>
          <p className="mt-1 text-zinc-400">Director encyclopedia</p>
        </Link>

        <div className="flex justify-center text-3xl text-zinc-600">│</div>

        <div className="rounded-2xl border-2 border-white bg-white p-5 text-black">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">
            Current Movie
          </p>
          <h3 className="mt-2 text-2xl font-bold">🎬 {movie.title}</h3>
        </div>
      </div>
    </section>
  );
}
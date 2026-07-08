import Link from "next/link";
import { movies } from "@/data/movies";
import ChooseYourRoute from "@/components/ChooseYourRoute";
import ExploreMore from "@/components/ExploreMore";
import MovieNotes from "@/components/MovieNotes";
import AtlasPosition from "@/components/AtlasPosition";
import MovieFacts from "@/components/MovieFacts";

type MovieDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;

  const movie = movies.find((movie) => movie.id === id);

  if (!movie) {
    return (
      <main className="min-h-screen bg-zinc-950 p-10 text-white">
        <h1 className="text-4xl font-bold">영화를 찾을 수 없습니다.</h1>

        <Link
          href="/encyclopedia/movies"
          className="mt-6 inline-block text-zinc-400 underline"
        >
          영화 목록으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-10 text-white">
      <Link
        href="/encyclopedia/movies"
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Movies
      </Link>

      <section className="mt-10 max-w-4xl">
        <p className="text-sm text-zinc-500">
          {movie.year} · {movie.countryFlag} {movie.country} · {movie.movement}
        </p>

        <h1 className="mt-3 text-5xl font-bold">{movie.title}</h1>

        <p className="mt-3 text-xl text-zinc-400">{movie.originalTitle}</p>

        <MovieFacts movie={movie} />

        <AtlasPosition movie={movie} />

        <MovieNotes
          atlasNote={`${movie.title}는 ${movie.movement} 흐름 속에서 볼 수 있는 작품입니다.`}
          myNote={movie.memo}
        />

        <ChooseYourRoute
          movieTitle={movie.title}
          director={movie.director}
          directorSlug={movie.directorSlug}
          country={movie.country}
          countrySlug={movie.countrySlug}
          movement={movie.movement}
          movementSlug={movie.movementSlug}
          mainActor={movie.actors[0]}
          mainActorSlug={movie.actorSlugs[0]}
          award={movie.awards[0]}
          awardSlug={movie.awardSlugs[0]}
        />

        <ExploreMore movie={movie} />
      </section>
    </main>
  );
}
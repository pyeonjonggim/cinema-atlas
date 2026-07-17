import { notFound } from "next/navigation";

import ActorDetailPage from "@/components/pages/ActorDetailPage";
import { getActorBySlug, getActors, getCountries, getDirectors, getMovies } from "@/lib/catalogQuery";

type ActorRouteProps = {
  params: Promise<{
    actor: string;
  }>;
};

export default async function ActorRoute({ params }: ActorRouteProps) {
  const { actor: actorSlug } = await params;
  const actor = await getActorBySlug(actorSlug);

  if (!actor) {
    notFound();
  }

  const actors = await getActors();
  const countries = await getCountries();
  const directors = await getDirectors();
  const movies = await getMovies();

  return (
    <ActorDetailPage
      actor={actor}
      actors={actors}
      countries={countries}
      directors={directors}
      movies={movies}
    />
  );
}

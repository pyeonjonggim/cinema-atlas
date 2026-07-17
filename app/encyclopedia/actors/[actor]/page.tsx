import { notFound } from "next/navigation";

import ActorDetailPage from "@/components/pages/ActorDetailPage";
import { getActorBySlug, getActorFilmography } from "@/lib/catalogQuery";

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

  const movies = await getActorFilmography(actorSlug);

  return (
    <ActorDetailPage
      actor={actor}
      actors={[actor]}
      countries={[]}
      directors={[]}
      movies={movies}
    />
  );
}

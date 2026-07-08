import { notFound } from "next/navigation";

import ActorDetailPage from "@/components/pages/ActorDetailPage";
import { actors } from "@/data/actors";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movies } from "@/data/movies";

type ActorRouteProps = {
  params: Promise<{
    actor: string;
  }>;
};

export default async function ActorRoute({ params }: ActorRouteProps) {
  const { actor: actorSlug } = await params;
  const actor = actors.find((item) => item.slug === actorSlug);

  if (!actor) {
    notFound();
  }

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

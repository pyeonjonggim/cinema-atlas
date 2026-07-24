import { notFound } from "next/navigation";

import ActorDetailPage from "@/components/pages/ActorDetailPage";
import { getActorBySlug, getActorFilmography } from "@/lib/catalogQuery";
import { ContinueJourneyEngine } from "@/lib/relationships/continueJourneyEngine";
import { projectContinueJourneyItems } from "@/lib/relationships/continueJourneyPresentation";

export const dynamic = "force-dynamic";

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
  const journey = await new ContinueJourneyEngine().buildForEntity(
    { type: "PERSON", id: actorSlug },
    { maximumResults: 4, entityFilters: ["MOVIE", "COUNTRY", "MOVEMENT"] },
  );
  const continueJourneyItems = projectContinueJourneyItems(journey, {
    labels: {
      PERSON: { [actorSlug]: actor.name },
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, movie.title])),
      COUNTRY: Object.fromEntries(movies.flatMap((movie) =>
        (movie.countryIds ?? [movie.countrySlug]).map((countryId) => [countryId, movie.country]),
      )),
      MOVEMENT: Object.fromEntries(movies.flatMap((movie) =>
        (movie.movementIds ?? [movie.movementSlug]).filter(Boolean).map((movementId) => [movementId, movie.movement]),
      )),
    },
    hrefs: {
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, `/movies/${movie.id}`])),
      COUNTRY: Object.fromEntries(movies.flatMap((movie) =>
        (movie.countryIds ?? [movie.countrySlug]).map((countryId) => [countryId, `/encyclopedia/countries/${movie.countrySlug}`]),
      )),
      MOVEMENT: Object.fromEntries(movies.flatMap((movie) =>
        (movie.movementIds ?? [movie.movementSlug]).filter(Boolean).map((movementId) => [movementId, `/encyclopedia/movements/${movementId}`]),
      )),
    },
    limit: 4,
  });

  return (
    <ActorDetailPage
      actor={actor}
      actors={[actor]}
      countries={[]}
      directors={[]}
      movies={movies}
      continueJourneyItems={continueJourneyItems}
    />
  );
}

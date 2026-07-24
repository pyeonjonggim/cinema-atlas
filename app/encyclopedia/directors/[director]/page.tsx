import { notFound } from "next/navigation";

import DirectorDetailPage from "@/components/pages/DirectorDetailPage";
import { getDirectorBySlug, getDirectorFilmography } from "@/lib/catalogQuery";
import { ContinueJourneyEngine } from "@/lib/relationships/continueJourneyEngine";
import { projectContinueJourneyItems } from "@/lib/relationships/continueJourneyPresentation";

export const dynamic = "force-dynamic";

type DirectorRouteProps = {
  params: Promise<{
    director: string;
  }>;
};

export default async function DirectorRoute({ params }: DirectorRouteProps) {
  const { director: directorSlug } = await params;
  const director = await getDirectorBySlug(directorSlug);

  if (!director) {
    notFound();
  }

  const movies = await getDirectorFilmography(directorSlug);
  const journey = await new ContinueJourneyEngine().buildForEntity(
    { type: "PERSON", id: directorSlug },
    { maximumResults: 4, entityFilters: ["MOVIE", "COUNTRY", "MOVEMENT"] },
  );
  const continueJourneyItems = projectContinueJourneyItems(journey, {
    labels: {
      PERSON: { [directorSlug]: director.name },
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
    <DirectorDetailPage
      director={director}
      directors={[director]}
      movies={movies}
      continueJourneyItems={continueJourneyItems}
    />
  );
}

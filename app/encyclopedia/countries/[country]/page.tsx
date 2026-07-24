import { notFound } from "next/navigation";

import CountryDetailPage from "@/components/pages/CountryDetailPage";
import { movements } from "@/data/movements";
import { getCountryBySlug, getCountryMovies } from "@/lib/catalogQuery";
import { ContinueJourneyEngine } from "@/lib/relationships/continueJourneyEngine";
import { projectContinueJourneyItems } from "@/lib/relationships/continueJourneyPresentation";

export const dynamic = "force-dynamic";

type CountryRouteProps = {
  params: Promise<{
    country: string;
  }>;
};

export default async function CountryRoute({ params }: CountryRouteProps) {
  const { country: countrySlug } = await params;
  const country = await getCountryBySlug(countrySlug);

  if (!country) {
    notFound();
  }

  const movies = await getCountryMovies(countrySlug);
  const countryId = country.isoCode?.toLowerCase() ?? countrySlug;
  const journey = await new ContinueJourneyEngine().buildForEntity(
    { type: "COUNTRY", id: countryId },
    { maximumResults: 4, entityFilters: ["MOVIE", "PERSON", "MOVEMENT"] },
  );
  const continueJourneyItems = projectContinueJourneyItems(journey, {
    labels: {
      COUNTRY: {
        [countryId]: country.name,
        [country.slug]: country.name,
      },
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, movie.title])),
      PERSON: Object.fromEntries(movies.flatMap((movie) => [
        ...(movie.directorIds ?? []).map((personId) => [personId, movie.director]),
        ...(movie.actorIds ?? []).map((personId, index) => [
          personId,
          movie.actors[index % Math.max(movie.actors.length, 1)] ?? personId,
        ]),
      ])),
      MOVEMENT: Object.fromEntries(movies.flatMap((movie) =>
        (movie.movementIds ?? [movie.movementSlug]).filter(Boolean).map((movementId) => [movementId, movie.movement]),
      )),
    },
    hrefs: {
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, `/movies/${movie.id}`])),
      PERSON: Object.fromEntries(movies.flatMap((movie) => [
        ...(movie.directorIds ?? []).map((personId) => [personId, `/encyclopedia/directors/${movie.directorSlug}`]),
        ...(movie.actorIds ?? []).map((personId, index) => [
          personId,
          `/encyclopedia/actors/${movie.actorSlugs[index % Math.max(movie.actorSlugs.length, 1)] ?? personId}`,
        ]),
      ])),
      MOVEMENT: Object.fromEntries(movies.flatMap((movie) =>
        (movie.movementIds ?? [movie.movementSlug]).filter(Boolean).map((movementId) => [movementId, `/encyclopedia/movements/${movementId}`]),
      )),
    },
    limit: 4,
  });

  return (
    <CountryDetailPage
      country={country}
      countries={[country]}
      directors={[]}
      movements={movements}
      movies={movies}
      continueJourneyItems={continueJourneyItems}
    />
  );
}

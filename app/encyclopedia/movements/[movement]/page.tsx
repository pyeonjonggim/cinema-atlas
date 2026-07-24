import { notFound } from "next/navigation";

import MovementDetailPage from "@/components/pages/MovementDetailPage";
import {
  getCountriesBySlugs,
  getDirectorsBySlugs,
  getMovementBySlug,
  getMovements,
  getMoviesByReferences,
} from "@/lib/catalogQuery";
import { ContinueJourneyEngine } from "@/lib/relationships/continueJourneyEngine";
import { projectContinueJourneyItems } from "@/lib/relationships/continueJourneyPresentation";

export const dynamic = "force-dynamic";

type MovementRouteProps = {
  params: Promise<{
    movement: string;
  }>;
};

export default async function MovementRoute({ params }: MovementRouteProps) {
  const { movement: movementSlug } = await params;
  const movement = await getMovementBySlug(movementSlug);

  if (!movement) {
    notFound();
  }

  const [movements, countries, directors, movies] = await Promise.all([
    getMovements(),
    getCountriesBySlugs(movement.countrySlugs),
    getDirectorsBySlugs(movement.directorSlugs),
    getMoviesByReferences([
      ...movement.essentialMovieIds,
      movement.starterMovieId,
    ].filter((item): item is string => Boolean(item))),
  ]);
  const journey = await new ContinueJourneyEngine().buildForEntity(
    { type: "MOVEMENT", id: movement.slug },
    { maximumResults: 4, entityFilters: ["MOVIE", "PERSON", "COUNTRY"] },
  );
  const continueJourneyItems = projectContinueJourneyItems(journey, {
    labels: {
      MOVEMENT: { [movement.slug]: movement.name },
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, movie.title])),
      PERSON: Object.fromEntries(directors.map((director) => [director.slug, director.name])),
      COUNTRY: Object.fromEntries(countries.flatMap((country) => [
        [country.slug, country.name],
        [country.isoCode?.toLowerCase() ?? country.slug, country.name],
      ])),
    },
    hrefs: {
      MOVIE: Object.fromEntries(movies.map((movie) => [movie.id, `/movies/${movie.id}`])),
      PERSON: Object.fromEntries(directors.map((director) => [director.slug, `/encyclopedia/directors/${director.slug}`])),
      COUNTRY: Object.fromEntries(countries.flatMap((country) => [
        [country.slug, `/encyclopedia/countries/${country.slug}`],
        [country.isoCode?.toLowerCase() ?? country.slug, `/encyclopedia/countries/${country.slug}`],
      ])),
    },
    limit: 4,
  });

  return (
    <MovementDetailPage
      movement={movement}
      movements={movements}
      countries={countries}
      directors={directors}
      movies={movies}
      continueJourneyItems={continueJourneyItems}
    />
  );
}

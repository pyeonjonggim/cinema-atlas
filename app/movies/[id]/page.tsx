import { notFound } from "next/navigation";

import MovieDetailPage from "@/components/pages/MovieDetailPage";
import { awards } from "@/data/awards";
import { movements } from "@/data/movements";
import { getMovieBySlug } from "@/lib/catalogQuery";
import { ContinueJourneyEngine } from "@/lib/relationships/continueJourneyEngine";
import { projectContinueJourneyItems } from "@/lib/relationships/continueJourneyPresentation";
import type { Actor } from "@/data/actors";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { Movie } from "@/types/movie";

export const dynamic = "force-dynamic";

type MovieDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function directorFromMovie(movie: Movie): Director {
  return {
    slug: movie.directorSlug,
    name: movie.director,
    nameKo: movie.director,
    country: movie.country,
    countrySlug: movie.countrySlug,
    countryFlag: movie.country,
    birthYear: 0,
    description: `${movie.director} is connected to ${movie.title} in the Cinema Atlas catalog.`,
    styleKeywords: movie.style?.slice(0, 3) ?? [],
    knownForMovieIds: [movie.id],
  };
}

function actorsFromMovie(movie: Movie): Actor[] {
  return movie.actorSlugs.map((slug, index) => ({
    slug,
    name: movie.actors[index] ?? slug,
    nameKo: movie.actors[index] ?? slug,
    countrySlug: movie.countrySlug,
    birthYear: 0,
    description: `${movie.actors[index] ?? slug} is connected to ${movie.title} in the Cinema Atlas catalog.`,
    whyMatters: "This performer is part of the film's catalog relationship graph.",
    screenPersona: [],
    keyRoles: [movie.title],
    essentialMovieIds: [movie.id],
    starterMovieId: movie.id,
    startingPointReason: `${movie.title} is the current starting point for this performer connection.`,
  }));
}

function countryFromMovie(movie: Movie): Country {
  return {
    slug: movie.countrySlug,
    name: movie.country,
    displayName: movie.country,
    isoCode: movie.countryIds?.find((id) => id.length === 2)?.toUpperCase(),
    nameKo: movie.country,
    flag: movie.countryFlag || movie.country,
    region: "Catalog Region",
    representativeEra: "Catalog Cinema",
    knownFor: "Catalog Cinema",
    description: `${movie.country} is connected to ${movie.title} in the Cinema Atlas catalog.`,
    whyMatters: "This country is part of the film's catalog relationship graph.",
    characteristics: [],
    themes: [],
    essentialMovieIds: [movie.id],
    starterMovieId: movie.id,
    startingPointReason: `${movie.title} is the current starting point for this country connection.`,
    directorSlugs: [movie.directorSlug],
    movementSlugs: movie.movementSlug ? [movie.movementSlug] : [],
  };
}

export default async function MovieDetailRoute({
  params,
}: MovieDetailRouteProps) {
  const { id } = await params;
  const movie = await getMovieBySlug(id);

  if (!movie) {
    notFound();
  }

  const directors = [directorFromMovie(movie)];
  const actors = actorsFromMovie(movie);
  const countries = [countryFromMovie(movie)];
  const journey = await new ContinueJourneyEngine().buildForEntity(
    { type: "MOVIE", id: movie.id },
    { maximumResults: 4 },
  );
  const labels = {
    MOVIE: { [movie.id]: movie.title },
    PERSON: {
      ...Object.fromEntries(movie.directorIds?.map((personId) => [personId, movie.director]) ?? []),
      ...Object.fromEntries(movie.actorIds?.map((personId, index) => [
        personId,
        movie.actors[index % Math.max(movie.actors.length, 1)] ?? personId,
      ]) ?? []),
    },
    COUNTRY: Object.fromEntries(movie.countryIds?.map((countryId) => [countryId, movie.country]) ?? []),
    MOVEMENT: Object.fromEntries(movie.movementIds?.map((movementId) => [movementId, movie.movement]) ?? []),
    AWARD: Object.fromEntries(movie.awardIds?.map((awardId, index) => [awardId, movie.awards[index] ?? awardId]) ?? []),
  };
  const hrefs = {
    PERSON: {
      ...Object.fromEntries(movie.directorIds?.map((personId) => [personId, `/encyclopedia/directors/${movie.directorSlug}`]) ?? []),
      ...Object.fromEntries(movie.actorIds?.map((personId, index) => [
        personId,
        `/encyclopedia/actors/${movie.actorSlugs[index % Math.max(movie.actorSlugs.length, 1)] ?? personId}`,
      ]) ?? []),
    },
    COUNTRY: Object.fromEntries(movie.countryIds?.map((countryId) => [countryId, `/encyclopedia/countries/${movie.countrySlug}`]) ?? []),
    MOVEMENT: Object.fromEntries(movie.movementIds?.map((movementId) => [movementId, `/encyclopedia/movements/${movementId}`]) ?? []),
    AWARD: Object.fromEntries(movie.awardIds?.map((awardId) => [awardId, `/encyclopedia/awards/${awardId}`]) ?? []),
  };
  const continueJourneyItems = projectContinueJourneyItems(journey, { labels, hrefs, limit: 4 });

  return (
    <MovieDetailPage
      movie={movie}
      movies={[]}
      directors={directors}
      countries={countries}
      movements={movements}
      actors={actors}
      awards={awards}
      continueJourneyItems={continueJourneyItems}
    />
  );
}

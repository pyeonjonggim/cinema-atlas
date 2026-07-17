import { notFound } from "next/navigation";

import MovieDetailPage from "@/components/pages/MovieDetailPage";
import { awards } from "@/data/awards";
import { movements } from "@/data/movements";
import { getMovieBySlug } from "@/lib/catalogQuery";
import type { Actor } from "@/data/actors";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { Movie } from "@/types/movie";

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

  return (
    <MovieDetailPage
      movie={movie}
      movies={[]}
      directors={directors}
      countries={countries}
      movements={movements}
      actors={actors}
      awards={awards}
    />
  );
}

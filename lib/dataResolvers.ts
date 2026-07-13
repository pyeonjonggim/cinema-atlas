import { actors } from "@/data/actors";
import { awards } from "@/data/awards";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movements } from "@/data/movements";
import { movies } from "@/data/movies";
import type { Actor } from "@/data/actors";
import type { Award } from "@/data/awards";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { Movement } from "@/data/movements";
import type { Movie } from "@/types/movie";

type EntityWithSlug = { slug: string };

function createSlugIndex<T extends EntityWithSlug>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.slug, item]));
}

function unique(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export const movieById = new Map<string, Movie>(
  movies.flatMap((movie) =>
    unique([movie.id, movie.slug]).map((id) => [id, movie] as const),
  ),
);

export const directorById = createSlugIndex(directors);
export const actorById = createSlugIndex(actors);
export const countryById = createSlugIndex(countries);
export const movementById = createSlugIndex(movements);
export const awardById = createSlugIndex(awards);

export function getMovieById(id: string): Movie | undefined {
  return movieById.get(id);
}

export function getMoviesByIds(ids: string[]): Movie[] {
  return ids.map(getMovieById).filter((movie): movie is Movie => Boolean(movie));
}

export function getDirectorById(id: string): Director | undefined {
  return directorById.get(id);
}

export function getDirectorsByIds(ids: string[]): Director[] {
  return ids.map(getDirectorById).filter((director): director is Director => Boolean(director));
}

export function getActorById(id: string): Actor | undefined {
  return actorById.get(id);
}

export function getActorsByIds(ids: string[]): Actor[] {
  return ids.map(getActorById).filter((actor): actor is Actor => Boolean(actor));
}

export function getCountryById(id: string): Country | undefined {
  return countryById.get(id);
}

export function getCountriesByIds(ids: string[]): Country[] {
  return ids.map(getCountryById).filter((country): country is Country => Boolean(country));
}

export function getMovementById(id: string): Movement | undefined {
  return movementById.get(id);
}

export function getMovementsByIds(ids: string[]): Movement[] {
  return ids
    .map(getMovementById)
    .filter((movement): movement is Movement => Boolean(movement));
}

export function getAwardById(id: string): Award | undefined {
  return awardById.get(id);
}

export function getAwardsByIds(ids: string[]): Award[] {
  return ids.map(getAwardById).filter((award): award is Award => Boolean(award));
}

export function getMovieCountryIds(movie: Movie): string[] {
  return unique([...(movie.countryIds ?? []), movie.countrySlug]);
}

export function getMovieDirectorIds(movie: Movie): string[] {
  return unique([...(movie.directorIds ?? []), movie.directorSlug]);
}

export function getMovieActorIds(movie: Movie): string[] {
  return unique([
    ...(movie.actorIds ?? []),
    ...movie.actorSlugs,
    ...(movie.cast?.map((member) => member.actorId) ?? []),
  ]);
}

export function getMovieMovementIds(movie: Movie): string[] {
  return unique([...(movie.movementIds ?? []), movie.movementSlug]);
}

export function getMovieAwardIds(movie: Movie): string[] {
  return unique([
    ...(movie.awardIds ?? []),
    ...movie.awardSlugs,
    ...(movie.awardMentions?.map((mention) => mention.awardId) ?? []),
  ]);
}

export function getMoviesByDirector(directorId: string): Movie[] {
  return movies.filter((movie) => getMovieDirectorIds(movie).includes(directorId));
}

export function getMoviesByActor(actorId: string): Movie[] {
  return movies.filter((movie) => getMovieActorIds(movie).includes(actorId));
}

export function getMoviesByCountry(countryId: string): Movie[] {
  return movies.filter((movie) => getMovieCountryIds(movie).includes(countryId));
}

export function getMoviesByMovement(movementId: string): Movie[] {
  return movies.filter((movie) => getMovieMovementIds(movie).includes(movementId));
}

export function getMoviesByAward(awardId: string): Movie[] {
  return movies.filter((movie) => getMovieAwardIds(movie).includes(awardId));
}

export function getMoviesByGenre(genreId: string): Movie[] {
  const key = genreId.toLocaleLowerCase("en-US");
  return movies.filter((movie) =>
    unique([movie.genre, ...(movie.genreIds ?? []), ...(movie.genres ?? [])])
      .map((value) => value.toLocaleLowerCase("en-US"))
      .includes(key),
  );
}


import type { Actor } from "@/data/actors";
import type { Award } from "@/data/awards";
import type { Country } from "@/data/countries";
import type { Director } from "@/data/directors";
import type { Movement } from "@/data/movements";
import type { Movie } from "@/types/movie";
import type { UnifiedSearchResult } from "@/lib/search/types";

type Match = Pick<UnifiedSearchResult, "matchedField" | "matchType" | "score">;

export function movieToSearchResult(movie: Movie, match: Match): UnifiedSearchResult {
  return {
    id: movie.id,
    slug: movie.slug ?? movie.id,
    entityType: "movie",
    title: movie.title,
    subtitle: [movie.year, movie.country, movie.director].filter(Boolean).join(" · "),
    description: movie.synopsis ?? movie.whyMatters,
    href: `/movies/${movie.slug ?? movie.id}`,
    imageUrl: movie.posterPath ?? movie.poster,
    year: movie.year,
    country: movie.country,
    ...match,
  };
}

export function directorToSearchResult(director: Director, match: Match): UnifiedSearchResult {
  return {
    id: director.slug,
    slug: director.slug,
    entityType: "director",
    title: director.name,
    subtitle: [director.country, director.birthYear || undefined].filter(Boolean).join(" · "),
    description: director.description,
    href: `/encyclopedia/directors/${director.slug}`,
    country: director.country,
    ...match,
  };
}

export function actorToSearchResult(actor: Actor, match: Match): UnifiedSearchResult {
  return {
    id: actor.slug,
    slug: actor.slug,
    entityType: "actor",
    title: actor.name,
    subtitle: [actor.countrySlug, actor.birthYear || undefined].filter(Boolean).join(" · "),
    description: actor.description,
    href: `/encyclopedia/actors/${actor.slug}`,
    ...match,
  };
}

export function countryToSearchResult(country: Country, match: Match): UnifiedSearchResult {
  return {
    id: country.slug,
    slug: country.slug,
    entityType: "country",
    title: country.displayName ?? country.name,
    subtitle: [country.isoCode, country.region].filter(Boolean).join(" · "),
    description: country.description,
    href: `/encyclopedia/countries/${country.slug}`,
    country: country.displayName ?? country.name,
    ...match,
  };
}

export function movementToSearchResult(movement: Movement, match: Match): UnifiedSearchResult {
  return {
    id: movement.slug,
    slug: movement.slug,
    entityType: "movement",
    title: movement.name,
    subtitle: movement.period,
    description: movement.description,
    href: `/encyclopedia/movements/${movement.slug}`,
    ...match,
  };
}

export function awardToSearchResult(award: Award, match: Match): UnifiedSearchResult {
  return {
    id: award.slug,
    slug: award.slug,
    entityType: "award",
    title: award.name,
    subtitle: [award.organization, award.countrySlug].filter(Boolean).join(" · "),
    description: award.description,
    href: `/encyclopedia/awards/${award.slug}`,
    ...match,
  };
}


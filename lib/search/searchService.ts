import "server-only";

import {
  getActors,
  getAwards,
  getCountries,
  getDirectors,
  getMovements,
  getMovies,
} from "@/lib/catalogQuery";
import { normalizeSearchQuery } from "@/lib/search/normalizer";
import { rankSearchableFields } from "@/lib/search/ranking";
import {
  actorToSearchResult,
  awardToSearchResult,
  countryToSearchResult,
  directorToSearchResult,
  movementToSearchResult,
  movieToSearchResult,
} from "@/lib/search/projection";
import type { SearchCatalogOptions, SearchEntityType, UnifiedSearchResult } from "@/lib/search/types";

const defaultEntityLimits: Record<SearchEntityType, number> = {
  movie: 8,
  director: 4,
  actor: 4,
  country: 3,
  movement: 3,
  award: 3,
};

const allEntityTypes: SearchEntityType[] = ["movie", "director", "actor", "country", "movement", "award"];

function selectedEntityTypes(options?: SearchCatalogOptions): SearchEntityType[] {
  const requested = options?.entityTypes?.filter((type) => allEntityTypes.includes(type));
  return requested && requested.length > 0 ? requested : allEntityTypes;
}

function sortResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  return [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });
}

function uniqueResults(results: UnifiedSearchResult[]): UnifiedSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.entityType}:${result.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyDiversity(results: UnifiedSearchResult[], limit: number, filtered: boolean): UnifiedSearchResult[] {
  const sorted = sortResults(uniqueResults(results));
  if (filtered) return sorted.slice(0, limit);

  const firstPass: UnifiedSearchResult[] = [];
  const overflow: UnifiedSearchResult[] = [];
  const counts = new Map<SearchEntityType, number>();

  for (const result of sorted) {
    const count = counts.get(result.entityType) ?? 0;
    if (count < defaultEntityLimits[result.entityType]) {
      firstPass.push(result);
      counts.set(result.entityType, count + 1);
    } else {
      overflow.push(result);
    }
  }

  return [...firstPass, ...overflow].slice(0, limit);
}

export async function searchCatalog(
  query: string,
  options?: SearchCatalogOptions,
): Promise<UnifiedSearchResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  const limit = Math.min(Math.max(options?.limit ?? 24, 1), 50);
  const entityTypes = selectedEntityTypes(options);
  if (normalizedQuery.length < 2) return [];

  const results: UnifiedSearchResult[] = [];

  if (entityTypes.includes("movie")) {
    const movies = await getMovies();
    for (const movie of movies) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "title", value: movie.title },
        { field: "originalTitle", value: movie.originalTitle },
        { field: "director", value: movie.director },
        { field: "country", value: [movie.country, movie.countrySlug, ...(movie.countryIds ?? [])], metadata: true },
        { field: "year", value: movie.year, metadata: true },
        { field: "description", value: [movie.synopsis, movie.whyMatters, ...(movie.themes ?? [])], metadata: true },
      ]);
      if (match) results.push(movieToSearchResult(movie, match));
    }
  }

  if (entityTypes.includes("director")) {
    const directors = await getDirectors();
    for (const director of directors) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "name", value: [director.name, director.nameKo] },
        { field: "country", value: [director.country, director.countrySlug], metadata: true },
        { field: "description", value: [director.description, director.whyMatters, ...director.styleKeywords], metadata: true },
      ]);
      if (match) results.push(directorToSearchResult(director, match));
    }
  }

  if (entityTypes.includes("actor")) {
    const actors = await getActors();
    for (const actor of actors) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "name", value: [actor.name, actor.nameKo] },
        { field: "country", value: actor.countrySlug, metadata: true },
        { field: "description", value: [actor.description, actor.whyMatters, ...actor.screenPersona], metadata: true },
      ]);
      if (match) results.push(actorToSearchResult(actor, match));
    }
  }

  if (entityTypes.includes("country")) {
    const countries = await getCountries();
    for (const country of countries) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "displayName", value: [country.displayName, country.name] },
        { field: "isoCode", value: country.isoCode },
        { field: "region", value: country.region, metadata: true },
        { field: "description", value: [country.description, country.whyMatters, ...country.characteristics, ...country.themes], metadata: true },
      ]);
      if (match) results.push(countryToSearchResult(country, match));
    }
  }

  if (entityTypes.includes("movement")) {
    const movements = await getMovements();
    for (const movement of movements) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "name", value: [movement.name, movement.nameKo] },
        { field: "era", value: movement.period },
        { field: "description", value: [movement.description, movement.whyMatters, ...movement.characteristics, ...movement.themes], metadata: true },
      ]);
      if (match) results.push(movementToSearchResult(movement, match));
    }
  }

  if (entityTypes.includes("award")) {
    const awards = await getAwards();
    for (const award of awards) {
      const match = rankSearchableFields(normalizedQuery, [
        { field: "name", value: [award.name, award.nameKo] },
        { field: "organization", value: award.organization },
        { field: "awardType", value: "award", metadata: true },
        { field: "country", value: award.countrySlug, metadata: true },
        { field: "description", value: [award.description, award.whyMatters, ...award.overview], metadata: true },
      ]);
      if (match) results.push(awardToSearchResult(award, match));
    }
  }

  return applyDiversity(results, limit, Boolean(options?.entityTypes?.length));
}

export { allEntityTypes };


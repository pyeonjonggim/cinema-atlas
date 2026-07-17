import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { actors } from "../data/actors.ts";
import { awards } from "../data/awards.ts";
import { countries } from "../data/countries.ts";
import { directors } from "../data/directors.ts";
import { movements } from "../data/movements.ts";
import { movies } from "../data/movies.ts";

const artifactDir = path.join(process.cwd(), "data", "imports", "unified-search");

async function writeSummary(summary) {
  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    path.join(artifactDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function hasEntity(results, entityType) {
  return results.some((result) => result.entityType === entityType);
}

function hasValidHref(result) {
  const prefixes = {
    movie: "/movies/",
    director: "/encyclopedia/directors/",
    actor: "/encyclopedia/actors/",
    country: "/encyclopedia/countries/",
    movement: "/encyclopedia/movements/",
    award: "/encyclopedia/awards/",
  };
  return result.href.startsWith(prefixes[result.entityType]);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function rank(query, fields) {
  const normalizedQuery = normalize(query);
  let best;

  for (const field of fields) {
    const values = Array.isArray(field.value) ? field.value : [field.value];
    for (const value of values) {
      const normalizedValue = normalize(value);
      if (!normalizedValue) continue;

      let score = 0;
      let matchType;
      if (normalizedValue === normalizedQuery) {
        score = 100;
        matchType = "exact";
      } else if (normalizedValue.startsWith(normalizedQuery)) {
        score = 80;
        matchType = "prefix";
      } else if (normalizedValue.split(" ").some((word) => word.startsWith(normalizedQuery))) {
        score = 60;
        matchType = "word-start";
      } else if (normalizedValue.includes(normalizedQuery)) {
        score = field.metadata ? 20 : 40;
        matchType = field.metadata ? "metadata" : "substring";
      }

      if (score > 0 && (!best || score > best.score)) {
        best = {
          score,
          matchType,
          matchedField: field.field,
        };
      }
    }
  }

  return best;
}

function result(entityType, slug, title, href, match) {
  return {
    id: slug,
    slug,
    entityType,
    title,
    href,
    score: match.score,
    matchType: match.matchType,
    matchedField: match.matchedField,
  };
}

async function searchCatalog(query, options = {}) {
  const normalizedQuery = normalize(query).slice(0, 120);
  if (normalizedQuery.length < 2) return [];

  const entityTypes = options.entityTypes ?? ["movie", "director", "actor", "country", "movement", "award"];
  const results = [];

  if (entityTypes.includes("movie")) {
    for (const movie of movies) {
      const match = rank(normalizedQuery, [
        { field: "title", value: movie.title },
        { field: "originalTitle", value: movie.originalTitle },
        { field: "director", value: movie.director },
        { field: "country", value: [movie.country, movie.countrySlug, ...(movie.countryIds ?? [])], metadata: true },
        { field: "year", value: movie.year, metadata: true },
        { field: "description", value: [movie.synopsis, movie.whyMatters, ...(movie.themes ?? [])], metadata: true },
      ]);
      if (match) results.push(result("movie", movie.slug ?? movie.id, movie.title, `/movies/${movie.slug ?? movie.id}`, match));
    }
  }

  if (entityTypes.includes("director")) {
    for (const director of directors) {
      const match = rank(normalizedQuery, [
        { field: "name", value: [director.name, director.nameKo] },
        { field: "country", value: [director.country, director.countrySlug], metadata: true },
        { field: "description", value: [director.description, director.whyMatters, ...director.styleKeywords], metadata: true },
      ]);
      if (match) results.push(result("director", director.slug, director.name, `/encyclopedia/directors/${director.slug}`, match));
    }
  }

  if (entityTypes.includes("actor")) {
    for (const actor of actors) {
      const match = rank(normalizedQuery, [
        { field: "name", value: [actor.name, actor.nameKo] },
        { field: "country", value: actor.countrySlug, metadata: true },
        { field: "description", value: [actor.description, actor.whyMatters, ...actor.screenPersona], metadata: true },
      ]);
      if (match) results.push(result("actor", actor.slug, actor.name, `/encyclopedia/actors/${actor.slug}`, match));
    }
  }

  if (entityTypes.includes("country")) {
    for (const country of countries) {
      const match = rank(normalizedQuery, [
        { field: "displayName", value: [country.displayName, country.name] },
        { field: "isoCode", value: country.isoCode },
        { field: "region", value: country.region, metadata: true },
        { field: "description", value: [country.description, country.whyMatters, ...country.characteristics, ...country.themes], metadata: true },
      ]);
      if (match) results.push(result("country", country.slug, country.displayName ?? country.name, `/encyclopedia/countries/${country.slug}`, match));
    }
  }

  if (entityTypes.includes("movement")) {
    for (const movement of movements) {
      const match = rank(normalizedQuery, [
        { field: "name", value: [movement.name, movement.nameKo] },
        { field: "era", value: movement.period },
        { field: "description", value: [movement.description, movement.whyMatters, ...movement.characteristics, ...movement.themes], metadata: true },
      ]);
      if (match) results.push(result("movement", movement.slug, movement.name, `/encyclopedia/movements/${movement.slug}`, match));
    }
  }

  if (entityTypes.includes("award")) {
    for (const award of awards) {
      const match = rank(normalizedQuery, [
        { field: "name", value: [award.name, award.nameKo] },
        { field: "organization", value: award.organization },
        { field: "awardType", value: "award", metadata: true },
        { field: "country", value: award.countrySlug, metadata: true },
        { field: "description", value: [award.description, award.whyMatters, ...award.overview], metadata: true },
      ]);
      if (match) results.push(result("award", award.slug, award.name, `/encyclopedia/awards/${award.slug}`, match));
    }
  }

  const seen = new Set();
  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .filter((item) => {
      const key = `${item.entityType}:${item.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, options.limit ?? 24);
}

const failures = [];
const checks = [];

const movieResults = await searchCatalog("Parasite");
checks.push({ query: "Parasite", count: movieResults.length, first: movieResults[0] });
assert(hasEntity(movieResults, "movie"), "Movie query did not return a movie result.", failures);
assert(movieResults[0]?.entityType === "movie", "Exact movie match did not rank first.", failures);

const directorResults = await searchCatalog("Bong Joon Ho");
checks.push({ query: "Bong Joon Ho", count: directorResults.length, first: directorResults[0] });
assert(hasEntity(directorResults, "director"), "Director query did not return a director result.", failures);

const actorResults = await searchCatalog("Song Kang");
checks.push({ query: "Song Kang", count: actorResults.length, first: actorResults[0] });
assert(hasEntity(actorResults, "actor"), "Actor query did not return an actor result.", failures);

const countryResults = await searchCatalog("South Korea");
checks.push({ query: "South Korea", count: countryResults.length, first: countryResults[0] });
assert(hasEntity(countryResults, "country"), "Country name query did not return a country result.", failures);

const isoResults = await searchCatalog("KR", { entityTypes: ["country"] });
checks.push({ query: "KR", count: isoResults.length, first: isoResults[0] });
assert(hasEntity(isoResults, "country"), "Country ISO query did not return a country result.", failures);

const movementResults = await searchCatalog("Korean Contemporary");
checks.push({ query: "Korean Contemporary", count: movementResults.length, first: movementResults[0] });
assert(hasEntity(movementResults, "movement"), "Movement query did not return a movement result.", failures);

const awardResults = await searchCatalog("Golden Lion");
checks.push({ query: "Golden Lion", count: awardResults.length, first: awardResults[0] });
assert(hasEntity(awardResults, "award"), "Award query did not return an award result.", failures);

const filteredMovies = await searchCatalog("Parasite", { entityTypes: ["movie"] });
checks.push({ query: "Parasite", filter: "movie", count: filteredMovies.length });
assert(filteredMovies.every((result) => result.entityType === "movie"), "Movie filter returned non-movie results.", failures);

const filteredMovements = await searchCatalog("Korean", { entityTypes: ["movement"] });
checks.push({ query: "Korean", filter: "movement", count: filteredMovements.length });
assert(
  filteredMovements.every((result) => result.entityType === "movement"),
  "Movement filter returned non-movement results.",
  failures,
);

for (const checkResults of [
  movieResults,
  directorResults,
  actorResults,
  countryResults,
  isoResults,
  movementResults,
  awardResults,
  filteredMovies,
  filteredMovements,
]) {
  const localKeys = checkResults.map((result) => `${result.entityType}:${result.slug}`);
  assert(new Set(localKeys).size === localKeys.length, "Duplicate result keys were found in a search result set.", failures);
}

const allResults = [
  ...movieResults,
  ...directorResults,
  ...actorResults,
  ...countryResults,
  ...isoResults,
  ...movementResults,
  ...awardResults,
  ...filteredMovies,
  ...filteredMovements,
];
assert(allResults.every(hasValidHref), "At least one result href does not match its canonical detail route.", failures);

const emptyResults = await searchCatalog("   ");
assert(emptyResults.length === 0, "Blank query should return no results.", failures);

const specialResults = await searchCatalog("@@@");
assert(specialResults.length === 0, "Special-character-only query should return no results.", failures);

const summary = {
  command: "verify:unified-search",
  status: failures.length === 0 ? "PASS" : "FAIL",
  checks,
  failures,
  completedAt: new Date().toISOString(),
};

await writeSummary(summary);
console.table([summary]);

if (failures.length > 0) {
  process.exitCode = 1;
}

# Cinema Atlas Canonical Query Integration v1 - Phase A

## Scope

Phase A migrates four canonical entities to one query architecture:

- Movie
- Director
- Actor
- Country

Movement and Award persistence are intentionally out of scope.

## Target Flow

```text
PostgreSQL
-> PostgresCatalogRepository
-> CatalogQueryService
-> Route
-> Page
-> UI
```

Pages no longer call repositories directly. They call `CatalogQueryService` exports.

## Unified Query API

`lib/catalogQuery.ts` now exposes:

- `getMovies`
- `getMovieBySlug`
- `getDirectors`
- `getDirectorBySlug`
- `getActors`
- `getActorBySlug`
- `getCountries`
- `getCountryBySlug`

Compatibility exports remain for older non-migrated areas, but the canonical pages use the new
async API.

## Person Projection

`catalog_people` remains the canonical Person source.

UI projections:

```text
Person
-> DirectorProjection
-> ActorProjection
```

Director and Actor are not duplicated in PostgreSQL. They are derived from person records and
movie relationship edges:

- `MOVIE_DIRECTED_BY_PERSON`
- `MOVIE_ACTED_BY_PERSON`

## Country Query

The temporary `getCanonicalCountryBySlug` helper was removed.
Country list and detail now use `CatalogQueryService`.

## Fallback Policy

Canonical source is PostgreSQL.

Fallback is allowed only inside `CatalogQueryService`:

- no `DATABASE_URL`
- repository read failure

Pages do not know whether fallback happened.

## Before / After

| Entity | Before | After |
| --- | --- | --- |
| Movie | JSON artifact + static fallback | Repository-backed `CatalogQueryService` |
| Director | `data/directors.ts` route source | Person projection through `CatalogQueryService` |
| Actor | static / movie-derived placeholder | Person projection through `CatalogQueryService` |
| Country | detail-only temporary DB helper | list/detail through `CatalogQueryService` |

## Validation

Run:

```bash
npm run verify:canonical-query-phase-a
```

The script verifies that PostgreSQL can provide at least two distinct slugs for each migrated
entity category.

Artifacts:

```text
data/imports/canonical-query-phase-a/
```

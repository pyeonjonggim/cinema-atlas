# Cinema Atlas Catalog Query Layer v1

## Purpose

Catalog Query Layer v1 is the first read migration from static sample data toward the approved Cinema Atlas catalog.

The goal is not to redesign UI or introduce a database. The goal is to make selected UI surfaces read through one stable service boundary:

Provider -> Normalize -> Validate -> Review -> Approved Catalog -> Repository Artifact -> CatalogQueryService -> UI

## Current Read Audit

Migrated in this sprint:

- Movie List: `components/pages/MovieListPage.tsx`
- Movie Detail route: `app/movies/[id]/page.tsx`
- Director Detail filmography feed: `app/encyclopedia/directors/[director]/page.tsx`
- Country Detail movie feed: `app/encyclopedia/countries/[country]/page.tsx`

Still static by design for this phase:

- Actor pages
- Movement pages
- Award pages
- Encyclopedia category list pages
- Explore and Journey helpers
- Passport calculations
- My Atlas, Journal, Collections, Insights
- Home featured sections
- Existing validation and legacy resolver helpers

The remaining static reads are intentionally kept as fallback and compatibility surfaces until later page-by-page migrations.

## Service Boundary

`lib/catalogQuery.ts` exposes the read API used by migrated UI. Pages should not call a repository or import catalog artifacts directly.

Minimum API:

- `listMovies()`
- `getMovieById(id)`
- `getDirectorFilmography(directorId)`
- `getCountryMovies(countryId)`
- `getActorFilmography(actorId)`
- `getMoviesByGenre(genreId)`
- `getMoviesByLanguage(languageId)`
- `getMoviesByCompany(companyId)`
- `getRelatedMovies(movieId)`

The implementation currently reads the approved 10-movie persistence pilot artifact and maps it into the existing `Movie` display shape. This keeps current components stable while the persistence model matures.

## Fallback Strategy

Static sample data remains available through the query layer.

Read order:

1. Approved catalog artifact movies
2. Static sample movies that are not duplicates by normalized title + year
3. Legacy `id` and `slug` lookups for existing routes

This allows new approved catalog records to appear in migrated views without removing or breaking current sample pages.

## Auto Propagation

When an approved movie exists in the persistence artifact, the query layer maps it once and exposes it to:

- Movie List
- Movie Detail
- Director filmography feeds
- Country movie feeds
- Actor, genre, language, and company query helpers for later migrations

MovieCard and detail components do not need per-movie generated code. They receive query results.

## Pilot Result

Command:

`npm run query:catalog-pilot`

Current artifact:

- Source: `data/imports/catalog-persistence-pilot/`
- Output: `data/imports/catalog-query-pilot/`
- Movies exposed by approved catalog artifact: 10
- Movie detail lookup: pass
- Director filmography query: pass
- Country movies query: pass
- Actor filmography query: pass
- Duplicate edges after re-import: 0
- Duplicate movies after re-import: 0
- Unresolved edges created: false

## Performance Notes

The v1 service builds in-memory maps at module load:

- `movieById`
- `edgesFromMovie`
- `edgesToEntity`
- `peopleById`

The pilot report tracks a small read budget:

- Query calls: 5
- Repository reads: 2
- Graph reads: 3

Future repository adapters should preserve the query API while replacing artifact reads with indexed database access and pagination.

## Static Usage Report

Catalog migrated:

- Movie List
- Movie Detail movie source
- Director Detail movie feed
- Country Detail movie feed

Static retained:

- Entity metadata for existing encyclopedia pages
- Actor Detail
- Movement Detail
- Award Detail
- Explore/Journey helper data
- Passport and My Atlas calculations
- Home featured content

This is expected for v1. The query layer now provides the seam for incremental migration without deleting `data/*.ts`.

## Future PostgreSQL Adapter

The query layer is intentionally repository-neutral. A future PostgreSQL adapter should support:

- Stable internal movie IDs
- External ID lookup
- Relation edge tables
- Paginated `listMovies`
- Indexed entity filmography queries
- Country, language, genre, and company relation lookups
- Soft fallback or migration mode for legacy sample records

UI should continue calling `CatalogQueryService`, not the database adapter directly.

# Catalog Persistence and Knowledge Graph v1

## 1. Purpose

Cinema Atlas is moving from static sample data toward a provider-neutral Global Cinema Catalog.

This document defines the persistence and graph foundation for:

Provider
-> Normalize
-> Validate
-> Review
-> Approved Catalog Record
-> Persistence
-> Relation Index
-> Knowledge Graph Query

This sprint does not introduce a production database or Graph DB.

## 2. Current Persistence Audit

Current storage locations:

| Area | Current storage | Owner | Persistence classification |
| --- | --- | --- | --- |
| Movies | `data/movies.ts` | Catalog sample data | static TypeScript sample |
| Directors / Actors / Countries / Movements / Awards | `data/*.ts` | Catalog and editorial sample data | static TypeScript sample |
| UserMovie | `data/userMovies.ts` | User layer | user-owned sample data |
| Journal | journal data files | User layer | user-owned sample data |
| Collections | collection data files | User layer | user-owned sample data |
| Passport | passport data files | User exploration layer | user-owned and system-derived sample data |
| Journeys | journey data files | Editorial layer | curated content |
| TMDB QA artifacts | `data/imports/tmdb-pilot-100/` | Import QA | generated JSON artifact |
| CanonicalMovieDraft | generated from provider records | Catalog import staging | generated staging record |
| Data resolvers | `lib/dataResolvers.ts` | Runtime lookup | derived index/helper |

Persistence boundaries:

- Catalog-owned data: movies, people, countries, genres, languages, companies, awards, movements, external IDs, import provenance.
- Editorial-owned data: journeys, movement links, essential films, study topics, recommendations, why-it-matters essays.
- User-owned data: watched status, ratings, journal, collections, passport activity.
- Generated data: QA reports, relation indexes, validation reports, duplicate candidates.

Generated data should remain reproducible. Curated editorial knowledge should be explicitly stored.

## 3. Internal ID Strategy

TMDB IDs are not Cinema Atlas primary keys.

Recommended structure:

```ts
{
  id: "mov_d9f4b3d10da5",
  legacyDraftId: "imdb-tt6751668",
  externalIds: {
    tmdbId: 496243,
    imdbId: "tt6751668",
    wikidataId: "Q61448040"
  }
}
```

Rules:

- Internal ID is stable and provider-neutral.
- External IDs are reconciliation keys, not identity.
- URL slug can remain separate from database ID.
- Existing route IDs should not be migrated in one step.
- Duplicate merge should preserve the internal ID selected as canonical.

Pilot rule:

- Prefer IMDb ID as the stable seed.
- Then Wikidata ID.
- Then normalized title plus year.
- TMDB ID is stored, but not used as the internal primary key seed when IMDb/Wikidata exists.

## 4. Approval Lifecycle

Catalog approval states:

- `INGESTED`
- `NORMALIZED`
- `VALIDATED`
- `REVIEW_REQUIRED`
- `APPROVED`
- `REJECTED`
- `ARCHIVED`

Rules:

- Pipeline `PASS` does not mean `APPROVED`.
- Content quality threshold alone does not approve hard mismatches.
- Manual review must be resolved before catalog insertion.
- Approval reason, timestamp, and reviewer/system actor must be preserved.

Current pilot approval rule:

- `pipelineStatus === "PASS"`
- `contentQualityScore >= 90`
- `reviewRequired === false`

## 5. Provider-Neutral Records

Catalog records:

- `CatalogMovieRecord`
- `CatalogPersonRecord`
- `CatalogCountryRecord`
- `CatalogGenreRecord`
- `CatalogLanguageRecord`
- `CatalogCompanyRecord`
- `CatalogAwardRecord`
- `CatalogMovementRecord`

User-owned records stay separate:

- `UserMovieRecord`
- `JournalRecord`
- `CollectionRecord`
- `PassportRecord`

Catalog and user data must not share a persistence record.

## 6. Entity Resolution

External strings are not final entities.

Flow:

Name or provider reference
-> entity candidate
-> external ID comparison
-> existing entity match
-> new entity candidate
-> approved relation

Types:

- `ResolvedEntityReference`
- `UnresolvedEntityReference`
- `EntityMatchCandidate`
- `EntityResolutionResult`

Automatic resolution targets:

- Director
- Writer
- Actor
- Producer
- Country
- Genre
- Language
- Production Company

Editorial-only or review-first targets:

- Movement
- Award
- Essential film relation
- Journey stop relation
- Study topic

## 7. Knowledge Graph Edge Model

The graph starts as explicit relation records. A Graph DB is optional future infrastructure.

Core edge:

```ts
{
  id: "movie:mov_x:MOVIE_DIRECTED_BY_PERSON:person:person_y",
  sourceType: "movie",
  sourceId: "mov_x",
  relationType: "MOVIE_DIRECTED_BY_PERSON",
  targetType: "person",
  targetId: "person_y",
  provenance: {
    provider: "tmdb",
    providerRecordId: "496243",
    importedAt: "...",
    pipelineVersion: "catalog-persistence-v1"
  },
  confidence: "high",
  isCurated: false
}
```

Supported relation types in v1:

- `MOVIE_DIRECTED_BY_PERSON`
- `MOVIE_ACTED_BY_PERSON`
- `MOVIE_WRITTEN_BY_PERSON`
- `MOVIE_PRODUCED_IN_COUNTRY`
- `MOVIE_HAS_GENRE`
- `MOVIE_USES_LANGUAGE`
- `MOVIE_PRODUCED_BY_COMPANY`
- `MOVIE_WON_AWARD`
- `MOVIE_PART_OF_MOVEMENT`
- `MOVIE_REMAKE_OF_MOVIE`
- `MOVIE_RELATED_TO_JOURNEY`
- `DIRECTOR_INFLUENCED_BY_DIRECTOR`
- `MOVIE_ESSENTIAL_FOR_COUNTRY`
- `MOVIE_RECOMMENDED_STARTING_POINT`

## 8. Computed vs Curated Relations

Computed edges come from provider metadata or deterministic system rules:

- Movie -> Director
- Movie -> Actor
- Movie -> Country
- Movie -> Genre
- Movie -> Language
- Movie -> Production Company

Curated edges come from Cinema Atlas editorial knowledge:

- Movie -> Movement
- Movie -> Journey
- Movie -> Essential for Country
- Movie -> Recommended Starting Point
- Director -> Influenced By
- Director -> Related Director
- Movie -> Study Topic

Every edge stores:

- provenance
- confidence
- `isCurated`

## 9. Provenance and Confidence

Provenance values:

- `tmdb`
- `imdb`
- `wikidata`
- `cinema-atlas-editorial`
- `user-generated`
- `system-derived`
- `manual`
- `mixed`

Confidence values:

- `exact`
- `high`
- `medium`
- `low`
- `editorial-confirmed`

External metadata is not editorial authority. Cinema Atlas editorial edges are separate curated authority.

## 10. Repository Interface

The provider-neutral `CatalogRepository` defines:

- `getMovieById`
- `getMovieByExternalId`
- `createMovie`
- `updateMovie`
- `upsertMovie`
- `listMovies`
- `saveEntity`
- `saveRelations`
- `saveApprovedMovieTransaction`
- `getRelationsFrom`
- `getRelationsTo`
- `findEntityCandidates`

The interface is implemented first by `InMemoryCatalogRepository`.

Future adapters can target PostgreSQL, Supabase Postgres, file storage for tests, or a graph/search system.

## 11. Transaction Boundary

Approving one movie should be atomic:

- Movie record
- External IDs
- Entity references
- Relations
- Import provenance
- Approval state

If any part fails, the adapter should roll back the entire movie approval operation.

The v1 API models this as:

`saveApprovedMovieTransaction(input)`

## 12. Idempotent Import

Same external movie imported twice must not create duplicates.

Match priority:

1. Existing external provider ID
2. Existing IMDb / Wikidata ID
3. Approved canonical match
4. title + year candidate
5. Manual review

Pilot result:

- First import: 10 movies, 303 edges
- Re-import: 10 movies, 303 edges
- Duplicate movies created: 0
- Duplicate edges created: 0

## 13. Relation Index

Graph traversal starts with in-memory indexes:

- `outgoingEdgesByEntity`
- `incomingEdgesByEntity`
- `edgesByRelationType`

Supported one-hop queries:

- Movie connections
- Director filmography
- Country film list
- Actor appearance list
- Movie related through shared entities

This avoids filtering every edge array on each query.

## 14. Query Layer

Implemented query helpers:

- `getConnectedEntities()`
- `getMovieConnections()`
- `getRelatedMovies()`

Future query helpers:

- `getDirectorNetwork()`
- `getCountryCinemaGraph()`
- `getRemakeLineage()`

No recommendation ranking or graph algorithm is implemented in v1.

## 15. Persistence Pilot Result

Command:

`npm run persist:catalog-pilot`

Input:

- `data/imports/tmdb-pilot-100/canonical/canonical-movie-drafts.json`
- `data/imports/tmdb-pilot-100/raw/external-movie-records.json`
- `data/imports/tmdb-pilot-100/reports/quality-report.json`

Output:

- `data/imports/catalog-persistence-pilot/movies.json`
- `data/imports/catalog-persistence-pilot/entities.json`
- `data/imports/catalog-persistence-pilot/edges.json`
- `data/imports/catalog-persistence-pilot/provenance.json`
- `data/imports/catalog-persistence-pilot/summary.json`
- `data/imports/catalog-persistence-pilot/unresolved.json`

Result:

- Approved input movies: 10
- Movie records: 10
- Entity records: 288
- Edge records: 303
- Unresolved input records preserved: 3
- Duplicate movies on re-import: 0
- Duplicate edges on re-import: 0

Query verification:

- First movie connections: 31
- First director filmography query: 2
- First country films query: 2

## 16. Database Recommendation

Recommended default: PostgreSQL.

Why:

- Strong transaction support
- Relation tables fit the edge model
- JSONB supports provider metadata and provenance
- Mature indexing and pagination
- Full-text search is available before adding a dedicated search engine
- Easy Next.js integration
- Supabase or managed PostgreSQL can reduce operations overhead

Comparison:

| Option | Fit | Notes |
| --- | --- | --- |
| PostgreSQL | High | Best default for catalog records, edge tables, transactions, and JSONB metadata |
| PostgreSQL + JSONB | High | Strong fit for external metadata and provenance while preserving relational edges |
| Supabase Postgres | High | Good managed option; also provides auth/storage later if needed |
| Managed PostgreSQL | High | Good production path when operations should stay simple |
| Neo4j / Graph DB | Future option | Useful only if graph traversal becomes the bottleneck; not needed for v1 |

Suggested initial schema shape:

- `catalog_movies`
- `catalog_people`
- `catalog_countries`
- `catalog_genres`
- `catalog_languages`
- `catalog_companies`
- `catalog_external_ids`
- `catalog_edges`
- `catalog_import_runs`
- `catalog_approval_events`

## 17. Future Migration Plan

1. Keep current TypeScript sample data stable.
2. Continue using JSON artifacts for import QA.
3. Add file/in-memory repository tests for pilot imports.
4. Create PostgreSQL schema only after 100/500 movie pilots are stable.
5. Migrate approved catalog records in small batches.
6. Preserve legacy route IDs until canonical slugs are planned.
7. Add search index after persistence model is stable.
8. Consider Graph DB only after relation-table queries become insufficient.


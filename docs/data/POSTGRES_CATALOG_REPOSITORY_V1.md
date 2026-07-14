# Postgres Catalog Repository v1

## Dependency Choice

Cinema Atlas uses `pg` for the first PostgreSQL repository adapter.

Reasoning:

- No ORM currently exists in the project.
- The CatalogRepository interface is already explicit and async.
- This sprint needs standard PostgreSQL compatibility, not a vendor-specific client.
- `pg` keeps the dependency surface small while preserving transaction control.

Drizzle or another migration layer can be considered later if schema evolution becomes too large for SQL migrations.

## Environment

Configured variables:

- `DATABASE_URL`
- `DATABASE_SSL`
- `DATABASE_POOL_MAX`

`DATABASE_URL` is server-only. It must never be read in Client Components or exposed to browser bundles.

When `DATABASE_URL` is absent, DB commands create a `SKIPPED` artifact with the reason. They do not pretend a database verification succeeded.

## Schema

Initial migration:

`db/migrations/0001_catalog_core.sql`

Core tables:

- `catalog_movies`
- `catalog_people`
- `catalog_countries`
- `catalog_genres`
- `catalog_languages`
- `catalog_companies`
- `catalog_external_ids`
- `catalog_aliases`
- `knowledge_graph_edges`
- `catalog_imports`
- `catalog_review_queue`
- `catalog_provenance`

The schema keeps Catalog, Editorial, and User data separate. User-owned records are not migrated in this sprint.

## Internal ID Strategy

PostgreSQL row identity uses Cinema Atlas internal IDs.

TMDB, IMDb, Wikidata, and future provider IDs are stored in `catalog_external_ids`.

Neither `tmdbId` nor URL slug is a primary key.

## External ID Constraints

`catalog_external_ids` prevents duplicate external identity links by:

- `entity_type + provider + external_key + external_value`
- `entity_type + provider + provider_entity_id` when provider entity ID exists

This supports idempotent imports and prevents two approved catalog entities from claiming the same exclusive provider identity.

## Knowledge Graph Edges

`knowledge_graph_edges` stores explicit relations with:

- source
- relation type
- target
- provenance
- confidence
- curated flag

Unique edge key:

`source_type + source_id + relation_type + target_type + target_id`

Indexes:

- source lookup
- target lookup
- relation type lookup

## Repository Architecture

`PostgresCatalogRepository` implements the existing `CatalogRepository` interface.

Important methods:

- `getMovieById`
- `getMovieByExternalId`
- `createMovie`
- `updateMovie`
- `upsertMovie`
- `listMovies`
- `saveEntity`
- `saveEntityAlias`
- `saveRelations`
- `saveApprovedMovieTransaction`
- `getRelationsFrom`
- `getRelationsTo`
- `findEntityCandidates`

UI does not call this repository directly. UI continues to go through `CatalogQueryService`.

## Async Query Boundary

PostgreSQL is async. The current migrated UI remains sync-compatible through artifact-backed `CatalogQueryService`.

Async-ready methods were added:

- `listMoviesAsync`
- `getMovieByIdAsync`
- `getDirectorFilmographyAsync`
- `getCountryMoviesAsync`

Future UI migration can move Server Components to `await` without changing MovieCard or page layout components.

## Repository Factory

`createCatalogRepository()` centralizes repository selection:

- `DATABASE_URL` configured: `PostgresCatalogRepository`
- no `DATABASE_URL`: `InMemoryCatalogRepository`

Fallback is for development and tests. Production should use configured PostgreSQL and fail loudly on connection errors.

## Transaction Model

Approved movie save is one transaction:

- movie record
- external IDs
- entities
- aliases when used
- graph edges

If any step fails, the transaction rolls back.

## Idempotency

Upsert priority:

1. TMDB external ID
2. IMDb external ID
3. Wikidata external ID
4. internal ID
5. manual review outside this adapter

Repeated seed/import must not create duplicate movies, external IDs, aliases, or edges.

## Commands

- `npm run db:migrate`
- `npm run db:seed:catalog-pilot`
- `npm run db:verify:catalog-pilot`

If no `DATABASE_URL` exists, each command writes a skipped artifact under:

`data/imports/postgres-catalog-pilot/`

## Pilot Migration

Input:

`data/imports/catalog-persistence-pilot/`

Expected pilot records:

- 10 movies
- entity records from the persistence artifact
- knowledge graph edges from the persistence artifact

Verification compares PostgreSQL counts and selected query results against the artifact.

## Query Performance

The verification command measures:

- `getMovieById`
- `listMovies`
- `getDirectorFilmography`
- `getCountryMovies`
- `getActorFilmography`
- external ID lookup

At pilot size, index presence matters more than absolute timing. Larger tests should add `EXPLAIN ANALYZE` reporting.

## Connection Pooling

The repository uses a singleton `pg.Pool`.

Defaults:

- `DATABASE_POOL_MAX` or 5
- `idleTimeoutMillis: 30000`
- `connectionTimeoutMillis: 5000`

For managed Postgres or Supabase, pooler mode should be reviewed before production deployment.

## Static Fallback Policy

Static `data/*.ts` remains for:

- development fallback
- migration compatibility
- sample content

Static data is not the long-term production Source of Truth.

## Rollback

Down migration:

`db/migrations/0001_catalog_core.down.sql`

Use only for local reset or controlled development rollback. Production rollback should be handled with backups and a migration plan.

## Future Work

- PostgreSQL-backed `CatalogQueryService` read path
- pagination
- search index
- user data migration
- review queue admin workflow
- richer provenance payload policy

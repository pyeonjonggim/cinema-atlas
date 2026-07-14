# Catalog Sync and Propagation v1

## Sync Architecture

Catalog sync turns an approved provider-neutral movie update into a consistent catalog state.

Flow:

External Update -> Normalize -> Validate -> Resolve Entities -> Approve -> Sync Plan -> PostgreSQL Transaction -> Relation Reconciliation -> Cache Invalidation Request -> Route Revalidation Request -> Search Update Request

Providers and UI do not write directly to the repository. They should go through `CatalogSyncService` or a sync command/job that uses the same plan lifecycle.

## Current Update Flow Audit

Before this sprint:

- New movie ingest wrote approved pilot artifacts.
- PostgreSQL seed wrote movies, entities, external IDs, and edges.
- Relation edges were appended/upserted but not reconciled as a lifecycle.
- Stale computed edges were not explicitly planned for removal.
- Curated edges were represented through `isCurated` but not protected by a sync policy.
- Query cache invalidation and route revalidation were not modeled.
- Search index updates were not modeled.

After this sprint:

- Sync input is provider-neutral.
- Sync plan is generated before writes.
- Computed edges are reconciled.
- Curated edges are preserved.
- Cache tags, route paths, and search update requests are emitted as artifacts.
- Pilot sync runs in PostgreSQL transactions and rolls back pilot writes.

## Input Model

`CatalogSyncInput` contains:

- canonical movie record
- approval state
- resolved entities
- unresolved entity labels
- incoming graph edges
- provenance
- quality score
- source version
- requester
- sync mode

Sync modes:

- `CREATE`
- `UPDATE`
- `REFRESH_METADATA`
- `REBUILD_RELATIONS`
- `DRY_RUN`

## Sync Plan

`CatalogSyncPlan` includes:

- movie create/update flags
- changed fields
- external ID changes
- entity creation candidates
- edges to add
- edges to remove
- curated edges preserved
- review items
- affected entity IDs
- affected routes
- affected cache tags
- search update requests

Dry run can inspect the plan before writes.

## Diff Rules

The diff engine detects changes in:

- title
- original title
- release date
- year
- runtime
- overview
- poster
- backdrop
- countries
- genres
- languages
- production companies

Identical values should not update rows or emit write events.

## Relation Reconciliation

Computed edges are reconciled rather than appended.

Automatically managed computed relations:

- Director
- Actor
- Writer
- Producer
- Country
- Genre
- Language
- Production Company

Rules:

- Add missing incoming computed edges.
- Remove stale existing computed edges.
- Never create edges to unresolved targets.
- Never duplicate edges.
- Preserve curated edges.

## Curated Edge Protection

Sync does not automatically delete or rewrite:

- Movement
- Award
- Journey
- Essential Film
- Recommended Starting Point
- Influenced By
- Related Director
- Study Topic
- Editorial Recommendation

These remain Cinema Atlas editorial knowledge.

## Transaction Model

The write lifecycle is transactional:

- movie upsert
- external ID changes
- entity references
- computed relation reconciliation
- sync event record

Failure rolls back the entire sync. Partial catalog state is not accepted.

## Sync Events

Migration `0002_catalog_sync_events` adds `catalog_sync_events`.

Event types:

- `MOVIE_CREATED`
- `MOVIE_UPDATED`
- `RELATIONS_REBUILT`
- `METADATA_REFRESHED`
- `SYNC_FAILED`
- `NO_CHANGE`
- `REVIEW_REQUIRED`

## Idempotency

Same input repeated should produce:

- no duplicate movies
- no duplicate edges
- no duplicate external IDs
- no unnecessary row growth
- `NO_CHANGE` when no diff remains

## Cache Invalidation

Cache tag requests are emitted, not directly executed:

- `catalog:movies`
- `movie:{movieId}`
- `director:{directorId}`
- `country:{countryId}`
- `actor:{actorId}`
- `genre:{genreId}`
- `language:{languageId}`
- `company:{companyId}`

## Route Revalidation

Route revalidation is adapter-ready and currently emitted as artifacts.

Potential paths:

- `/movies`
- `/movies/{movieId}`
- `/encyclopedia/directors/{personId}`
- `/encyclopedia/actors/{personId}`
- `/encyclopedia/countries/{countryId}`

The data service does not directly bind itself to Next.js APIs. A later adapter can call `revalidatePath` or `revalidateTag`.

## Search Update Hook

Search is not implemented in this sprint.

The sync lifecycle emits `SearchIndexUpdateRequest` records:

- `UPSERT`
- `DELETE`
- `REINDEX`

These requests can feed a future search index without changing provider or repository logic.

## Pilot Scenarios

Command:

`npm run sync:catalog-pilot`

Scenarios:

- New movie create
- Metadata update
- Relation update
- No change
- Failure rollback
- Review required

Artifacts:

- `data/imports/catalog-sync-pilot/sync-plans.json`
- `data/imports/catalog-sync-pilot/sync-events.json`
- `data/imports/catalog-sync-pilot/relation-diffs.json`
- `data/imports/catalog-sync-pilot/cache-invalidations.json`
- `data/imports/catalog-sync-pilot/route-revalidations.json`
- `data/imports/catalog-sync-pilot/search-update-requests.json`
- `data/imports/catalog-sync-pilot/summary.json`

## Failure Recovery

The pilot forces a failure inside a savepoint and verifies catalog movie count remains unchanged.

The pilot also runs inside a wrapping transaction and rolls back temporary sync movie writes so the 10-movie catalog pilot remains stable.

## Future Background Job Strategy

Future work:

- background sync queue
- retry policy by provider error class
- persistent cache/revalidation adapter
- real search index adapter
- review queue admin workflow
- larger batch sync with backpressure

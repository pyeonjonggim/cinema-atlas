# Cinema Atlas Automatic Update Foundation v1

## Purpose

Automatic Update Foundation v1 adds the first durable job layer above `CatalogSyncService`.
This sprint does not implement a scheduler, cron process, background worker, retry queue,
search update execution, cache invalidation execution, or an admin dashboard.

The goal is to make catalog sync executable through a persistent job record:

```text
SyncJob
-> SyncJobService
-> CatalogSyncService
-> Catalog persistence
-> Sync history
```

## SyncJob Entity

`SyncJob` represents one requested provider sync for one catalog entity.

Fields:

- `id`
- `entityType`
- `entityId`
- `provider`
- `status`
- `priority`
- `attemptCount`
- `createdAt`
- `startedAt`
- `finishedAt`
- `lastError`
- `metadata`

Statuses:

- `pending`
- `running`
- `succeeded`
- `failed`
- `cancelled`

Priorities:

- `low`
- `normal`
- `high`

## PostgreSQL Persistence

Migration `0003_catalog_sync_jobs` creates `catalog_sync_jobs`.

Indexes:

- `status`
- `priority`
- `entity_type`
- `entity_id`
- `created_at`
- `(status, priority, created_at)`

Duplicate prevention is enforced by a partial unique index:

```sql
UNIQUE (entity_type, entity_id, provider)
WHERE status IN ('pending', 'running')
```

This means a new job may be created after a previous job succeeds, fails, or is cancelled,
but duplicate active work for the same provider/entity pair is blocked.

## Repository

`SyncJobRepository` exposes:

- `create`
- `findPending`
- `findRunning`
- `findLatestForEntity`
- `markRunning`
- `markSucceeded`
- `markFailed`
- `cancel`
- `incrementAttempt`

`PostgresSyncJobRepository` is the first implementation.

## Service

`SyncJobService` owns the application workflow:

- create jobs
- create catalog sync jobs from `CatalogSyncInput`
- prevent duplicate active jobs through the repository
- transition status
- increment attempts
- record failure information
- run a job with a supplied runner

The runner is intentionally injected. This keeps the job layer independent from any
future queue or worker implementation.

## CatalogSyncService Integration

Current direct execution:

```text
CatalogSyncService
```

New foundation:

```text
SyncJobService.createCatalogSyncJob(input)
-> SyncJobService.runJob(job.id, runner)
-> runner invokes CatalogSyncService
```

The sprint keeps execution synchronous and explicit. Queue and worker ownership is left
for the next sprint.

## History First

Jobs are not hard deleted. Completed, failed, and cancelled records remain available as
history. The active duplicate guard only applies to `pending` and `running` jobs.

## Pilot Verification

Run:

```bash
npm run sync:jobs-pilot
```

The pilot verifies:

- duplicate active job prevention
- `pending -> running -> succeeded`
- `pending -> running -> failed`
- cancellation
- latest job lookup
- history preservation

Artifacts:

```text
data/imports/sync-job-pilot/
```

## Future Work

The next layers can attach without reshaping the model:

1. Background Worker
2. Scheduler
3. Automatic Sync
4. Search Index Update
5. Global Search

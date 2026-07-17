# Cinema Atlas Automatic Update Job Dispatcher v1

## Purpose

Automatic Update Job Dispatcher v1 adds the job selection layer between
`SyncJobService` and a future background worker.

This sprint does not implement:

- Scheduler
- Cron
- Background Worker
- Parallel Worker
- Retry Queue
- Search Index Update
- Cache Invalidation
- Admin Dashboard

The dispatcher only chooses executable work and reserves it safely.

## Architecture

```text
SyncJob
-> SyncJobService
-> SyncJobDispatcher
-> future Background Worker
-> CatalogSyncService
```

## Dispatch Contract

`SyncJobDispatcher` exposes:

- `peekNext(limit?)`
- `dispatchNext()`
- `dispatchBatch(limit)`

`peekNext` only reads pending jobs.
`dispatchNext` and `dispatchBatch` reserve jobs by moving them from `pending` to `running`.

## Ordering

Jobs are selected by:

1. Priority
2. Created time

Priority order:

```text
high
normal
low
```

Within the same priority, the oldest `createdAt` is dispatched first.

## Atomic Reservation

PostgreSQL reservation uses a single statement:

```sql
WITH next_jobs AS (
  SELECT id
  FROM catalog_sync_jobs
  WHERE status = 'pending'
  ORDER BY priority_rank, created_at ASC
  LIMIT $1
  FOR UPDATE SKIP LOCKED
)
UPDATE catalog_sync_jobs
SET status = 'running'
FROM next_jobs
WHERE catalog_sync_jobs.id = next_jobs.id
RETURNING catalog_sync_jobs.*
```

This prevents two dispatchers from reserving the same pending job.

## Dispatchable Jobs

Only `pending` jobs are dispatchable.

Excluded statuses:

- `running`
- `succeeded`
- `failed`
- `cancelled`

Failed jobs remain historical records. Retry handling is intentionally not part of this sprint.

## Repository Extension

`SyncJobRepository` now includes:

- `reserveNext()`
- `reserveBatch(limit)`

`PostgresSyncJobRepository` implements both methods with database-level locking.

## Pilot

Run:

```bash
npm run dispatch:jobs-pilot
```

The pilot verifies:

- priority ordering
- FIFO ordering inside the same priority
- `pending -> running` reservation
- batch dispatch
- exclusion of succeeded / failed / cancelled jobs
- duplicate dispatch prevention

Artifacts:

```text
data/imports/sync-job-dispatcher-pilot/
```

## Future Worker Boundary

The future worker should remain simple:

```text
job = dispatcher.dispatchNext()
worker.run(job)
```

The worker should not implement ordering or reservation logic.

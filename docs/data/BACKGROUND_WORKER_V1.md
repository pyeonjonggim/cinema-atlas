# Cinema Atlas Background Worker v1

## Purpose

Background Worker v1 adds the execution layer for already-dispatched sync jobs.
It is a bounded worker, not a daemon.

This sprint does not implement:

- Scheduler
- Cron
- Infinite worker loop
- Parallel worker
- Retry queue
- Search index update execution
- Cache invalidation execution
- Admin dashboard

## Architecture

```text
SyncJob
-> SyncJobService
-> SyncJobDispatcher
-> BackgroundWorker
-> MovieSyncRunner
-> CatalogSyncService
-> Database
```

## Responsibilities

The worker:

- asks the dispatcher for a batch of jobs
- selects a runner from the registry
- executes each job
- records success or failure through `SyncJobService`
- continues after individual job failures
- returns an execution report

The worker does not:

- create jobs
- choose ordering
- reserve jobs directly
- run forever
- retry failed jobs

## Runner Registry

`StaticRunnerRegistry` maps `entityType` to a runner.

Current runner:

- `movie -> MovieSyncRunner`

Future runners can be added without changing worker orchestration:

- `person`
- `company`
- `award`
- `collection`

## MovieSyncRunner

`MovieSyncRunner` owns the movie sync boundary and receives a `CatalogSyncService`.
The default executor confirms the CatalogSyncService boundary and returns a pass result.
Production hosts can inject a richer executor that loads provider payloads and runs the full
catalog sync flow.

## Execution Flow

```text
runOnce(limit)
-> dispatcher.dispatchBatch(limit)
-> for each running job:
   -> jobService.incrementAttempt(job.id)
   -> runner.run(job)
   -> jobService.markSucceeded(job.id)
   -> or jobService.markFailed(job.id)
-> return BackgroundWorkerReport
```

## Error Isolation

Each job is wrapped independently.
If one job fails, the worker records the failure and continues processing the remaining jobs.

## Pilot

Run:

```bash
npm run worker:jobs-pilot
```

The pilot verifies:

- dispatcher integration
- runner registry usage
- movie runner execution
- success state persistence
- failed state persistence
- multiple job processing
- failure isolation
- execution report

Artifacts:

```text
data/imports/background-worker-pilot/
```

## Future Scheduler Boundary

The next sprint can schedule bounded worker invocations:

```text
Scheduler
-> BackgroundWorker.runOnce(limit)
```

The scheduler should not implement job selection or execution details.

# Cinema Atlas Automatic Update Scheduler v1

## Purpose

Automatic Update Scheduler v1 adds the final trigger layer for the bounded
automatic update pipeline.

The scheduler is intentionally simple:

```text
Scheduler
-> BackgroundWorker.runOnce(limit)
```

It does not inspect jobs, call the dispatcher, or run sync logic directly.

## Out of Scope

This sprint does not implement:

- Distributed Scheduler
- Leader Election
- Cron deployment
- PM2 / systemd integration
- Docker scheduler
- Retry queue
- Notification
- Search update execution
- Cache invalidation execution
- Admin dashboard

## Configuration

`BackgroundSchedulerConfig` contains:

- `enabled`
- `intervalMs`
- `batchSize`

These values are currently passed as a typed config object and can later move to
environment variables or a config file without changing scheduler behavior.

Default config:

```ts
{
  enabled: true,
  intervalMs: 15 * 60 * 1000,
  batchSize: 10,
}
```

## Execution Flow

```text
runOnce()
-> if disabled: log skipped
-> if already running: log skipped
-> worker.runOnce(batchSize)
-> record execution log
-> return scheduler report
```

## Graceful Skip

The scheduler has an in-process running guard.
If a worker execution is already in progress, the scheduler returns a skipped report
with `skipReason: "worker-running"`.

If `enabled` is false, it returns a skipped report with `skipReason: "disabled"`.

## Execution Logging

Every scheduler invocation records:

- start time
- finish time
- skipped flag
- skip reason
- processed jobs
- succeeded jobs
- failed jobs
- execution time

The first implementation keeps logs in memory. A future production scheduler can persist
these logs without changing the report contract.

## Scheduler Report

`BackgroundSchedulerReport` includes:

- `schedulerStarted`
- `workerTriggered`
- `skipped`
- `skipReason`
- `processedJobs`
- `succeededJobs`
- `failedJobs`
- `executionTimeMs`
- `workerReport`
- `executionLog`

## Pilot

Run:

```bash
npm run scheduler:pilot
```

The pilot verifies:

- worker trigger
- batch size configuration
- scheduler report
- execution logging
- worker-running graceful skip
- disabled graceful skip
- no infinite loop
- no distributed scheduling
- no retry queue

Artifacts:

```text
data/imports/background-scheduler-pilot/
```

## Completed Pipeline v1

After this sprint, the v1 automatic update pipeline is:

```text
BackgroundScheduler
-> BackgroundWorker
-> SyncJobDispatcher
-> RunnerRegistry
-> MovieSyncRunner
-> CatalogSyncService
-> Database
```

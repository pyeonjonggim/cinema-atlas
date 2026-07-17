import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "background-scheduler-pilot");

function now() {
  return new Date().toISOString();
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, fileName), JSON.stringify(payload, null, 2));
}

function mapJob(row) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    provider: row.provider,
    status: row.status,
    priority: row.priority,
    attemptCount: row.attempt_count,
    createdAt: new Date(row.created_at).toISOString(),
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : undefined,
    lastError: row.last_error ?? undefined,
    metadata: row.metadata ?? {},
  };
}

async function insertJob(client, input) {
  const result = await client.query(
    `INSERT INTO catalog_sync_jobs (
      id, entity_type, entity_id, provider, status, priority, created_at, metadata
    )
    VALUES ($1,'movie',$2,'tmdb','pending',$3,$4,$5)
    RETURNING *`,
    [
      `scheduler_job_pilot_${randomUUID()}`,
      input.entityId,
      input.priority ?? "normal",
      input.createdAt ?? now(),
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return mapJob(result.rows[0]);
}

async function dispatchBatch(client, limit) {
  const result = await client.query(
    `WITH candidates AS (
      SELECT id, priority, created_at
      FROM catalog_sync_jobs
      WHERE status = 'pending'
      ORDER BY
        CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
        created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    ),
    next_jobs AS (
      SELECT id,
        ROW_NUMBER() OVER (
          ORDER BY
            CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
            created_at ASC
        ) AS dispatch_order
      FROM candidates
    ),
    updated_jobs AS (
      UPDATE catalog_sync_jobs jobs
      SET status = 'running',
        started_at = COALESCE(jobs.started_at, NOW()),
        finished_at = NULL,
        last_error = NULL
      FROM next_jobs
      WHERE jobs.id = next_jobs.id
      RETURNING jobs.*, next_jobs.dispatch_order
    )
    SELECT *
    FROM updated_jobs
    ORDER BY dispatch_order ASC`,
    [limit],
  );
  return result.rows.map(mapJob);
}

async function incrementAttempt(client, jobId) {
  const result = await client.query(
    `UPDATE catalog_sync_jobs
     SET attempt_count = attempt_count + 1
     WHERE id = $1
     RETURNING *`,
    [jobId],
  );
  return mapJob(result.rows[0]);
}

async function markSucceeded(client, jobId, metadata) {
  const result = await client.query(
    `UPDATE catalog_sync_jobs
     SET status = 'succeeded',
      finished_at = NOW(),
      last_error = NULL,
      metadata = metadata || $2::jsonb
     WHERE id = $1 AND status = 'running'
     RETURNING *`,
    [jobId, JSON.stringify(metadata ?? {})],
  );
  return mapJob(result.rows[0]);
}

async function markFailed(client, jobId, error, metadata) {
  const result = await client.query(
    `UPDATE catalog_sync_jobs
     SET status = 'failed',
      finished_at = NOW(),
      last_error = $2,
      metadata = metadata || $3::jsonb
     WHERE id = $1 AND status = 'running'
     RETURNING *`,
    [jobId, error, JSON.stringify(metadata ?? {})],
  );
  return mapJob(result.rows[0]);
}

async function runWorkerOnce(client, limit) {
  const started = performance.now();
  const jobs = await dispatchBatch(client, limit);
  const results = [];

  for (const job of jobs) {
    const jobStarted = performance.now();
    const startedAt = now();
    try {
      const attemptedJob = await incrementAttempt(client, job.id);
      if (attemptedJob.metadata?.forceFailure) {
        throw new Error(`forced scheduler pilot failure for ${attemptedJob.entityId}`);
      }
      await markSucceeded(client, attemptedJob.id, {
        worker: "BackgroundWorker",
        runner: "MovieSyncRunner",
        schedulerPilot: true,
      });
      results.push({
        jobId: job.id,
        entityId: job.entityId,
        status: "succeeded",
        startedAt,
        finishedAt: now(),
        executionTimeMs: Number((performance.now() - jobStarted).toFixed(2)),
      });
    } catch (error) {
      await markFailed(client, job.id, error instanceof Error ? error.message : String(error), {
        worker: "BackgroundWorker",
        schedulerPilot: true,
      });
      results.push({
        jobId: job.id,
        entityId: job.entityId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        startedAt,
        finishedAt: now(),
        executionTimeMs: Number((performance.now() - jobStarted).toFixed(2)),
      });
    }
  }

  return {
    processedJobs: results.length,
    succeededJobs: results.filter((result) => result.status === "succeeded").length,
    failedJobs: results.filter((result) => result.status === "failed").length,
    executionTimeMs: Number((performance.now() - started).toFixed(2)),
    jobResults: results,
  };
}

function createScheduler(worker, config) {
  let running = false;
  const logs = [];

  async function runOnce() {
    const startedAt = now();
    const started = performance.now();

    if (!config.enabled) {
      const log = {
        id: `scheduler_log_${randomUUID()}`,
        startedAt,
        finishedAt: now(),
        skipped: true,
        skipReason: "disabled",
        processedJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        executionTimeMs: Number((performance.now() - started).toFixed(2)),
      };
      logs.push(log);
      return {
        schedulerStarted: true,
        workerTriggered: false,
        skipped: true,
        skipReason: "disabled",
        processedJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        executionTimeMs: log.executionTimeMs,
        executionLog: log,
      };
    }

    if (running) {
      const log = {
        id: `scheduler_log_${randomUUID()}`,
        startedAt,
        finishedAt: now(),
        skipped: true,
        skipReason: "worker-running",
        processedJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        executionTimeMs: Number((performance.now() - started).toFixed(2)),
      };
      logs.push(log);
      return {
        schedulerStarted: true,
        workerTriggered: false,
        skipped: true,
        skipReason: "worker-running",
        processedJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        executionTimeMs: log.executionTimeMs,
        executionLog: log,
      };
    }

    running = true;
    try {
      const workerReport = await worker.runOnce(config.batchSize);
      const log = {
        id: `scheduler_log_${randomUUID()}`,
        startedAt,
        finishedAt: now(),
        skipped: false,
        processedJobs: workerReport.processedJobs,
        succeededJobs: workerReport.succeededJobs,
        failedJobs: workerReport.failedJobs,
        executionTimeMs: Number((performance.now() - started).toFixed(2)),
      };
      logs.push(log);
      return {
        schedulerStarted: true,
        workerTriggered: true,
        skipped: false,
        processedJobs: workerReport.processedJobs,
        succeededJobs: workerReport.succeededJobs,
        failedJobs: workerReport.failedJobs,
        executionTimeMs: log.executionTimeMs,
        workerReport,
        executionLog: log,
      };
    } finally {
      running = false;
    }
  }

  return {
    runOnce,
    logs,
    setRunningForPilot(value) {
      running = value;
    },
  };
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "background-scheduler-pilot", "summary.json"), "scheduler:pilot");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();
  const prefix = `scheduler_pilot_${Date.now()}`;
  const config = {
    enabled: true,
    intervalMs: 15 * 60 * 1000,
    batchSize: 2,
  };

  try {
    await client.query("BEGIN");

    const seededJobs = [
      await insertJob(client, {
        entityId: `${prefix}_success_high`,
        priority: "high",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      await insertJob(client, {
        entityId: `${prefix}_failure_normal`,
        priority: "normal",
        createdAt: "2026-01-01T00:00:01.000Z",
        metadata: { forceFailure: true },
      }),
      await insertJob(client, {
        entityId: `${prefix}_left_for_next_run`,
        priority: "low",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
    ];

    const worker = {
      runOnce: (limit) => runWorkerOnce(client, limit),
    };
    const scheduler = createScheduler(worker, config);
    const runReport = await scheduler.runOnce();

    scheduler.setRunningForPilot(true);
    const skipReport = await scheduler.runOnce();
    scheduler.setRunningForPilot(false);

    const disabledScheduler = createScheduler(worker, { ...config, enabled: false });
    const disabledReport = await disabledScheduler.runOnce();

    const finalRows = await client.query(
      `SELECT * FROM catalog_sync_jobs
       WHERE entity_id LIKE $1
       ORDER BY created_at ASC`,
      [`${prefix}%`],
    );
    const finalJobs = finalRows.rows.map(mapJob);
    const processedRows = finalJobs.filter((job) => job.status === "succeeded" || job.status === "failed");
    const pendingRows = finalJobs.filter((job) => job.status === "pending");

    const summary = {
      command: "scheduler:pilot",
      status:
        runReport.workerTriggered &&
        runReport.processedJobs === 2 &&
        runReport.succeededJobs === 1 &&
        runReport.failedJobs === 1 &&
        skipReport.skipped &&
        skipReport.skipReason === "worker-running" &&
        disabledReport.skipped &&
        disabledReport.skipReason === "disabled" &&
        processedRows.length === 2 &&
        pendingRows.length === 1
          ? "PASS"
          : "FAILED",
      schedulerStarted: true,
      workerTriggered: runReport.workerTriggered,
      processedJobs: runReport.processedJobs,
      succeededJobs: runReport.succeededJobs,
      failedJobs: runReport.failedJobs,
      gracefulSkipPassed: skipReport.skipped && skipReport.skipReason === "worker-running",
      disabledSkipPassed: disabledReport.skipped && disabledReport.skipReason === "disabled",
      scheduleConfigurationPassed:
        config.enabled === true && config.intervalMs === 900000 && config.batchSize === 2,
      executionLoggingPassed: scheduler.logs.length === 2 && scheduler.logs.every((log) => Boolean(log.startedAt && log.finishedAt)),
      pendingJobsLeft: pendingRows.length,
      distributedSchedulerImplemented: false,
      leaderElectionImplemented: false,
      retryQueueImplemented: false,
      executionTimeMs: runReport.executionTimeMs,
      completedAt: now(),
    };

    await writeArtifact("config.json", config);
    await writeArtifact("seed-jobs.json", seededJobs);
    await writeArtifact("scheduler-reports.json", [runReport, skipReport, disabledReport]);
    await writeArtifact("execution-logs.json", [...scheduler.logs, ...disabledScheduler.logs]);
    await writeArtifact("final-jobs.json", finalJobs);
    await writeArtifact("summary.json", summary);

    await client.query("ROLLBACK");
    console.table([summary]);
    if (summary.status !== "PASS") process.exitCode = 1;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

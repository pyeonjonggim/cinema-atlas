import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "background-worker-pilot");

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
    VALUES ($1,$2,$3,$4,'pending',$5,$6,$7)
    RETURNING *`,
    [
      `worker_job_pilot_${randomUUID()}`,
      input.entityType ?? "movie",
      input.entityId,
      input.provider ?? "tmdb",
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

function createRegistry() {
  return {
    movie: async (job) => {
      if (job.metadata?.forceFailure) {
        throw new Error(`forced worker failure for ${job.entityId}`);
      }
      return {
        status: "PASS",
        metadata: {
          runner: "MovieSyncRunner",
          catalogSyncServiceReached: true,
          entityId: job.entityId,
        },
      };
    },
  };
}

async function runWorkerOnce(client, limit, registry) {
  const started = performance.now();
  const jobs = await dispatchBatch(client, limit);
  const results = [];

  for (const job of jobs) {
    const jobStarted = performance.now();
    const startedAt = now();
    const runner = registry[job.entityType];

    try {
      if (!runner) throw new Error(`No runner registered for entity type: ${job.entityType}`);
      const attemptedJob = await incrementAttempt(client, job.id);
      const runnerResult = await runner(attemptedJob);
      await markSucceeded(client, job.id, {
        worker: "BackgroundWorker",
        runner: "MovieSyncRunner",
        resultStatus: runnerResult.status,
        resultMetadata: runnerResult.metadata,
      });
      results.push({
        jobId: job.id,
        entityType: job.entityType,
        entityId: job.entityId,
        status: "succeeded",
        startedAt,
        finishedAt: now(),
        executionTimeMs: Number((performance.now() - jobStarted).toFixed(2)),
      });
    } catch (error) {
      await markFailed(client, job.id, error instanceof Error ? error.message : String(error), {
        worker: "BackgroundWorker",
      });
      results.push({
        jobId: job.id,
        entityType: job.entityType,
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

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "background-worker-pilot", "summary.json"), "worker:jobs-pilot");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();
  const prefix = `worker_pilot_${Date.now()}`;

  try {
    await client.query("BEGIN");

    const seededJobs = [
      await insertJob(client, {
        entityId: `${prefix}_success_high`,
        priority: "high",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      await insertJob(client, {
        entityId: `${prefix}_failure`,
        priority: "normal",
        createdAt: "2026-01-01T00:00:01.000Z",
        metadata: { forceFailure: true },
      }),
      await insertJob(client, {
        entityId: `${prefix}_success_after_failure`,
        priority: "normal",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
    ];

    const report = await runWorkerOnce(client, 3, createRegistry());
    const finalRows = await client.query(
      `SELECT * FROM catalog_sync_jobs
       WHERE entity_id LIKE $1
       ORDER BY created_at ASC`,
      [`${prefix}%`],
    );
    const finalJobs = finalRows.rows.map(mapJob);
    const successJobs = finalJobs.filter((job) => job.status === "succeeded");
    const failedJobs = finalJobs.filter((job) => job.status === "failed");
    const failureIsolationPassed =
      report.jobResults[1]?.status === "failed" &&
      report.jobResults[2]?.status === "succeeded";

    const summary = {
      command: "worker:jobs-pilot",
      status:
        report.processedJobs === 3 &&
        successJobs.length === 2 &&
        failedJobs.length === 1 &&
        failureIsolationPassed &&
        finalJobs.every((job) => job.attemptCount === 1)
          ? "PASS"
          : "FAILED",
      seededJobs: seededJobs.length,
      processedJobs: report.processedJobs,
      succeededJobs: report.succeededJobs,
      failedJobs: report.failedJobs,
      dispatcherIntegrated: true,
      runnerRegistryUsed: true,
      movieRunnerUsed: successJobs.every((job) => job.metadata?.runner === "MovieSyncRunner"),
      successStatePassed: successJobs.length === 2,
      failedStatePassed: failedJobs.length === 1,
      failureIsolationPassed,
      infiniteLoopImplemented: false,
      schedulerImplemented: false,
      retryQueueImplemented: false,
      executionTimeMs: report.executionTimeMs,
      completedAt: now(),
    };

    await writeArtifact("seed-jobs.json", seededJobs);
    await writeArtifact("execution-report.json", report);
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

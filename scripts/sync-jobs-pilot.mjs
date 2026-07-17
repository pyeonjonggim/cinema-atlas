import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "sync-job-pilot");

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

async function createJob(client, input) {
  const existing = await client.query(
    `SELECT * FROM catalog_sync_jobs
     WHERE entity_type = $1 AND entity_id = $2 AND provider = $3
      AND status IN ('pending', 'running')
     ORDER BY created_at ASC
     LIMIT 1`,
    [input.entityType, input.entityId, input.provider],
  );
  if (existing.rows[0]) return mapJob(existing.rows[0]);

  const result = await client.query(
    `INSERT INTO catalog_sync_jobs (
      id, entity_type, entity_id, provider, status, priority, metadata
    )
    VALUES ($1,$2,$3,$4,'pending',$5,$6)
    ON CONFLICT (entity_type, entity_id, provider)
      WHERE status IN ('pending', 'running')
    DO UPDATE SET metadata = catalog_sync_jobs.metadata || EXCLUDED.metadata
    RETURNING *`,
    [
      `sync_job_pilot_${randomUUID()}`,
      input.entityType,
      input.entityId,
      input.provider,
      input.priority ?? "normal",
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return mapJob(result.rows[0]);
}

async function updateJob(client, query, params) {
  const result = await client.query(query, params);
  if (!result.rows[0]) throw new Error("Expected sync job state transition to update one row.");
  return mapJob(result.rows[0]);
}

async function markRunning(client, jobId) {
  return updateJob(
    client,
    `UPDATE catalog_sync_jobs
     SET status = 'running',
      started_at = COALESCE(started_at, NOW()),
      finished_at = NULL,
      last_error = NULL
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [jobId],
  );
}

async function incrementAttempt(client, jobId) {
  return updateJob(
    client,
    `UPDATE catalog_sync_jobs
     SET attempt_count = attempt_count + 1
     WHERE id = $1
     RETURNING *`,
    [jobId],
  );
}

async function markSucceeded(client, jobId, metadata = {}) {
  return updateJob(
    client,
    `UPDATE catalog_sync_jobs
     SET status = 'succeeded',
      finished_at = NOW(),
      last_error = NULL,
      metadata = metadata || $2::jsonb
     WHERE id = $1 AND status = 'running'
     RETURNING *`,
    [jobId, JSON.stringify(metadata)],
  );
}

async function markFailed(client, jobId, error, metadata = {}) {
  return updateJob(
    client,
    `UPDATE catalog_sync_jobs
     SET status = 'failed',
      finished_at = NOW(),
      last_error = $2,
      metadata = metadata || $3::jsonb
     WHERE id = $1 AND status = 'running'
     RETURNING *`,
    [jobId, error, JSON.stringify(metadata)],
  );
}

async function cancelJob(client, jobId, reason) {
  return updateJob(
    client,
    `UPDATE catalog_sync_jobs
     SET status = 'cancelled',
      finished_at = NOW(),
      last_error = $2,
      metadata = metadata || $3::jsonb
     WHERE id = $1 AND status IN ('pending', 'running')
     RETURNING *`,
    [jobId, reason, JSON.stringify({ cancelReason: reason })],
  );
}

async function findPending(client, limit = 25) {
  const result = await client.query(
    `SELECT * FROM catalog_sync_jobs
     WHERE status = 'pending'
     ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
      created_at ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map(mapJob);
}

async function findRunning(client, limit = 25) {
  const result = await client.query(
    `SELECT * FROM catalog_sync_jobs
     WHERE status = 'running'
     ORDER BY started_at ASC NULLS LAST, created_at ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map(mapJob);
}

async function findLatestForEntity(client, entityType, entityId, provider) {
  const result = await client.query(
    `SELECT * FROM catalog_sync_jobs
     WHERE entity_type = $1 AND entity_id = $2 AND provider = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityType, entityId, provider],
  );
  return result.rows[0] ? mapJob(result.rows[0]) : undefined;
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "sync-job-pilot", "summary.json"), "sync:jobs-pilot");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();
  const prefix = `sync_job_pilot_${Date.now()}`;
  const steps = [];

  try {
    await client.query("BEGIN");

    const baseInput = {
      entityType: "movie",
      entityId: `${prefix}_parasite`,
      provider: "tmdb",
      priority: "high",
      metadata: {
        source: "sync-job-pilot",
        createdAt: now(),
      },
    };

    const firstJob = await createJob(client, baseInput);
    const duplicateJob = await createJob(client, {
      ...baseInput,
      metadata: { duplicateProbe: true },
    });
    const pendingAfterDuplicate = await client.query(
      `SELECT COUNT(*)::int AS count FROM catalog_sync_jobs
       WHERE entity_type = $1 AND entity_id = $2 AND provider = $3
        AND status IN ('pending', 'running')`,
      [baseInput.entityType, baseInput.entityId, baseInput.provider],
    );
    steps.push({
      name: "Duplicate Prevention",
      passed: firstJob.id === duplicateJob.id && pendingAfterDuplicate.rows[0].count === 1,
      firstJobId: firstJob.id,
      duplicateJobId: duplicateJob.id,
      activeCount: pendingAfterDuplicate.rows[0].count,
    });

    const runningJob = await markRunning(client, firstJob.id);
    const attemptedJob = await incrementAttempt(client, runningJob.id);
    const succeededJob = await markSucceeded(client, attemptedJob.id, {
      catalogSyncResult: "mock-pass",
    });
    steps.push({
      name: "Pending to Running to Succeeded",
      passed:
        runningJob.status === "running" &&
        attemptedJob.attemptCount === 1 &&
        succeededJob.status === "succeeded" &&
        Boolean(succeededJob.finishedAt),
      job: succeededJob,
    });

    const failedJob = await createJob(client, {
      entityType: "movie",
      entityId: `${prefix}_failed`,
      provider: "tmdb",
      priority: "normal",
      metadata: { source: "sync-job-pilot" },
    });
    await markRunning(client, failedJob.id);
    await incrementAttempt(client, failedJob.id);
    const failedResult = await markFailed(client, failedJob.id, "forced pilot failure", {
      failedBy: "sync-job-pilot",
    });
    steps.push({
      name: "Pending to Running to Failed",
      passed:
        failedResult.status === "failed" &&
        failedResult.attemptCount === 1 &&
        failedResult.lastError === "forced pilot failure",
      job: failedResult,
    });

    const cancelledJob = await createJob(client, {
      entityType: "person",
      entityId: `${prefix}_cancelled_person`,
      provider: "tmdb",
      priority: "low",
      metadata: { source: "sync-job-pilot" },
    });
    const cancelledResult = await cancelJob(client, cancelledJob.id, "pilot cancellation");
    steps.push({
      name: "Cancel Pending Job",
      passed: cancelledResult.status === "cancelled" && cancelledResult.lastError === "pilot cancellation",
      job: cancelledResult,
    });

    const pendingJobs = await findPending(client, 10);
    const runningJobs = await findRunning(client, 10);
    const latestForEntity = await findLatestForEntity(
      client,
      baseInput.entityType,
      baseInput.entityId,
      baseInput.provider,
    );
    const historyRows = await client.query(
      `SELECT COUNT(*)::int AS count FROM catalog_sync_jobs
       WHERE entity_id LIKE $1`,
      [`${prefix}%`],
    );
    steps.push({
      name: "Repository Queries and History",
      passed:
        latestForEntity?.id === succeededJob.id &&
        historyRows.rows[0].count === 3 &&
        pendingJobs.every((job) => job.status === "pending") &&
        runningJobs.every((job) => job.status === "running"),
      latestForEntity,
      historyCount: historyRows.rows[0].count,
    });

    const summary = {
      command: "sync:jobs-pilot",
      status: steps.every((step) => step.passed) ? "PASS" : "FAILED",
      jobsCreated: 3,
      duplicatePrevented: steps.find((step) => step.name === "Duplicate Prevention")?.passed ?? false,
      successTransitionPassed:
        steps.find((step) => step.name === "Pending to Running to Succeeded")?.passed ?? false,
      failureTransitionPassed:
        steps.find((step) => step.name === "Pending to Running to Failed")?.passed ?? false,
      historyPreserved: historyRows.rows[0].count === 3,
      queueImplemented: false,
      workerImplemented: false,
      schedulerImplemented: false,
      completedAt: now(),
    };

    await writeArtifact("jobs.json", [succeededJob, failedResult, cancelledResult]);
    await writeArtifact("steps.json", steps);
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

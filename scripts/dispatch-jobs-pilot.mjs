import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  createPool,
  hasDatabaseUrl,
  pilotOutputRoot,
  writeSkippedArtifact,
} from "./lib/postgres-pilot-utils.mjs";

const outputRoot = path.resolve(pilotOutputRoot, "..", "sync-job-dispatcher-pilot");

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

function priorityRank(priority) {
  return { high: 0, normal: 1, low: 2 }[priority] ?? 3;
}

async function insertJob(client, input) {
  const result = await client.query(
    `INSERT INTO catalog_sync_jobs (
      id, entity_type, entity_id, provider, status, priority, created_at, metadata
    )
    VALUES ($1,$2,$3,$4,'pending',$5,$6,$7)
    RETURNING *`,
    [
      `dispatch_job_pilot_${randomUUID()}`,
      input.entityType ?? "movie",
      input.entityId,
      input.provider ?? "tmdb",
      input.priority,
      input.createdAt,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return mapJob(result.rows[0]);
}

async function reserveBatch(client, limit) {
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

async function reserveNext(client) {
  const jobs = await reserveBatch(client, 1);
  return jobs[0];
}

async function findPending(client, limit = 25) {
  const result = await client.query(
    `SELECT *
     FROM catalog_sync_jobs
     WHERE status = 'pending'
     ORDER BY
      CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
      created_at ASC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map(mapJob);
}

async function main() {
  if (!hasDatabaseUrl()) {
    await writeSkippedArtifact(path.join("..", "sync-job-dispatcher-pilot", "summary.json"), "dispatch:jobs-pilot");
    return;
  }

  const pool = createPool();
  const client = await pool.connect();
  const prefix = `dispatch_pilot_${Date.now()}`;
  const steps = [];

  try {
    await client.query("BEGIN");

    const seedJobs = [
      await insertJob(client, {
        entityId: `${prefix}_low_old`,
        priority: "low",
        createdAt: "2026-01-01T00:00:00.000Z",
        metadata: { expectedOrder: 6 },
      }),
      await insertJob(client, {
        entityId: `${prefix}_normal_old`,
        priority: "normal",
        createdAt: "2026-01-01T00:00:01.000Z",
        metadata: { expectedOrder: 4 },
      }),
      await insertJob(client, {
        entityId: `${prefix}_high_new`,
        priority: "high",
        createdAt: "2026-01-01T00:00:05.000Z",
        metadata: { expectedOrder: 2 },
      }),
      await insertJob(client, {
        entityId: `${prefix}_high_old`,
        priority: "high",
        createdAt: "2026-01-01T00:00:00.000Z",
        metadata: { expectedOrder: 1 },
      }),
      await insertJob(client, {
        entityId: `${prefix}_normal_new`,
        priority: "normal",
        createdAt: "2026-01-01T00:00:06.000Z",
        metadata: { expectedOrder: 5 },
      }),
      await insertJob(client, {
        entityId: `${prefix}_high_middle`,
        priority: "high",
        createdAt: "2026-01-01T00:00:03.000Z",
        metadata: { expectedOrder: 3 },
      }),
    ];

    await client.query(
      `INSERT INTO catalog_sync_jobs (
        id, entity_type, entity_id, provider, status, priority, created_at, metadata, finished_at
      )
      VALUES
        ($1,'movie',$2,'tmdb','succeeded','high',NOW(),'{}'::jsonb,NOW()),
        ($3,'movie',$4,'tmdb','failed','high',NOW(),'{}'::jsonb,NOW()),
        ($5,'movie',$6,'tmdb','cancelled','high',NOW(),'{}'::jsonb,NOW())`,
      [
        `dispatch_job_pilot_${randomUUID()}`,
        `${prefix}_succeeded_excluded`,
        `dispatch_job_pilot_${randomUUID()}`,
        `${prefix}_failed_excluded`,
        `dispatch_job_pilot_${randomUUID()}`,
        `${prefix}_cancelled_excluded`,
      ],
    );

    const peeked = await findPending(client, 6);
    const expectedOrdering = [...seedJobs].sort((a, b) => {
      const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.localeCompare(b.createdAt);
    });
    steps.push({
      name: "Priority and FIFO Ordering",
      passed: peeked.map((job) => job.id).join("|") === expectedOrdering.map((job) => job.id).join("|"),
      expected: expectedOrdering.map((job) => job.entityId),
      actual: peeked.map((job) => job.entityId),
    });

    const nextJob = await reserveNext(client);
    const nextJobAfterDuplicateProbe = await reserveNext(client);
    steps.push({
      name: "dispatchNext reserves oldest high priority first",
      passed:
        nextJob?.entityId === `${prefix}_high_old` &&
        nextJob.status === "running" &&
        nextJobAfterDuplicateProbe?.entityId === `${prefix}_high_middle`,
      first: nextJob,
      second: nextJobAfterDuplicateProbe,
    });

    const batch = await reserveBatch(client, 3);
    steps.push({
      name: "dispatchBatch reserves next jobs by priority and FIFO",
      passed:
        batch.length === 3 &&
        batch.every((job) => job.status === "running") &&
        batch.map((job) => job.entityId).join("|") ===
          [
            `${prefix}_high_new`,
            `${prefix}_normal_old`,
            `${prefix}_normal_new`,
          ].join("|"),
      batch,
    });

    const excludedRows = await client.query(
      `SELECT status, COUNT(*)::int AS count
       FROM catalog_sync_jobs
       WHERE entity_id LIKE $1 AND status IN ('succeeded', 'failed', 'cancelled')
       GROUP BY status
       ORDER BY status`,
      [`${prefix}%_excluded`],
    );
    const remainingPending = await findPending(client, 10);
    steps.push({
      name: "Only pending jobs are dispatchable",
      passed:
        excludedRows.rows.reduce((sum, row) => sum + row.count, 0) === 3 &&
        remainingPending.every((job) => job.status === "pending") &&
        !remainingPending.some((job) => job.entityId.includes("excluded")),
      excludedRows: excludedRows.rows,
      remainingPending: remainingPending.map((job) => job.entityId),
    });

    const allRunningRows = await client.query(
      `SELECT id, COUNT(*)::int AS count
       FROM catalog_sync_jobs
       WHERE entity_id LIKE $1 AND status = 'running'
       GROUP BY id
       HAVING COUNT(*) > 1`,
      [`${prefix}%`],
    );
    const dispatchedIds = [nextJob, nextJobAfterDuplicateProbe, ...batch].filter(Boolean).map((job) => job.id);
    steps.push({
      name: "Duplicate Dispatch Prevention",
      passed: new Set(dispatchedIds).size === dispatchedIds.length && allRunningRows.rows.length === 0,
      dispatchedIds,
    });

    const summary = {
      command: "dispatch:jobs-pilot",
      status: steps.every((step) => step.passed) ? "PASS" : "FAILED",
      seededPendingJobs: seedJobs.length,
      dispatchedJobs: dispatchedIds.length,
      priorityOrderingPassed: steps.find((step) => step.name === "Priority and FIFO Ordering")?.passed ?? false,
      fifoOrderingPassed: steps.find((step) => step.name === "Priority and FIFO Ordering")?.passed ?? false,
      runningReservationPassed:
        steps.find((step) => step.name === "dispatchNext reserves oldest high priority first")?.passed ?? false,
      batchDispatchPassed:
        steps.find((step) => step.name === "dispatchBatch reserves next jobs by priority and FIFO")?.passed ?? false,
      duplicateDispatchPrevented:
        steps.find((step) => step.name === "Duplicate Dispatch Prevention")?.passed ?? false,
      schedulerImplemented: false,
      workerImplemented: false,
      retryQueueImplemented: false,
      completedAt: now(),
    };

    await writeArtifact("seed-jobs.json", seedJobs);
    await writeArtifact("dispatch-results.json", [nextJob, nextJobAfterDuplicateProbe, ...batch]);
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

import "server-only";

import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";

import { getPostgresPool } from "@/lib/db/postgres";
import type {
  CreateSyncJobInput,
  SyncJob,
  SyncJobCompletionInput,
  SyncJobFailureInput,
  SyncJobRepository,
  SyncJobEntityType,
} from "@/types/syncJob";
import type { CatalogProvenanceProvider } from "@/types/catalogPersistence";

type SyncJobRow = {
  id: string;
  entity_type: SyncJob["entityType"];
  entity_id: string;
  provider: SyncJob["provider"];
  status: SyncJob["status"];
  priority: SyncJob["priority"];
  attempt_count: number;
  created_at: Date | string;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  last_error: string | null;
  metadata: SyncJob["metadata"];
};

function toIso(value: Date | string | null): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: SyncJobRow): SyncJob {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    provider: row.provider,
    status: row.status,
    priority: row.priority,
    attemptCount: row.attempt_count,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    lastError: row.last_error ?? undefined,
    metadata: row.metadata ?? {},
  };
}

function mergeMetadata(existing: SyncJob["metadata"], incoming?: SyncJob["metadata"]): SyncJob["metadata"] {
  return { ...(existing ?? {}), ...(incoming ?? {}) };
}

export class PostgresSyncJobRepository implements SyncJobRepository {
  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async create(input: CreateSyncJobInput): Promise<SyncJob> {
    const existing = await this.findActiveForEntity(input.entityType, input.entityId, input.provider);
    if (existing) return existing;

    const result = await this.pool.query<SyncJobRow>(
      `INSERT INTO catalog_sync_jobs (
        id, entity_type, entity_id, provider, status, priority, metadata
      )
      VALUES ($1,$2,$3,$4,'pending',$5,$6)
      ON CONFLICT (entity_type, entity_id, provider)
        WHERE status IN ('pending', 'running')
      DO UPDATE SET metadata = catalog_sync_jobs.metadata || EXCLUDED.metadata
      RETURNING *`,
      [
        `sync_job_${randomUUID()}`,
        input.entityType,
        input.entityId,
        input.provider,
        input.priority ?? "normal",
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return mapRow(result.rows[0]);
  }

  async findPending(limit = 25): Promise<SyncJob[]> {
    const result = await this.pool.query<SyncJobRow>(
      `SELECT * FROM catalog_sync_jobs
       WHERE status = 'pending'
       ORDER BY
        CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
        created_at ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map(mapRow);
  }

  async findRunning(limit = 25): Promise<SyncJob[]> {
    const result = await this.pool.query<SyncJobRow>(
      `SELECT * FROM catalog_sync_jobs
       WHERE status = 'running'
       ORDER BY started_at ASC NULLS LAST, created_at ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map(mapRow);
  }

  async reserveNext(): Promise<SyncJob | undefined> {
    const jobs = await this.reserveBatch(1);
    return jobs[0];
  }

  async reserveBatch(limit: number): Promise<SyncJob[]> {
    const result = await this.pool.query<SyncJobRow>(
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
      [Math.max(1, limit)],
    );

    return result.rows.map(mapRow);
  }

  async findLatestForEntity(
    entityType: SyncJobEntityType,
    entityId: string,
    provider?: CatalogProvenanceProvider,
  ): Promise<SyncJob | undefined> {
    const params: Array<string> = [entityType, entityId];
    const providerFilter = provider ? "AND provider = $3" : "";
    if (provider) params.push(provider);

    const result = await this.pool.query<SyncJobRow>(
      `SELECT * FROM catalog_sync_jobs
       WHERE entity_type = $1 AND entity_id = $2 ${providerFilter}
       ORDER BY created_at DESC
       LIMIT 1`,
      params,
    );

    return result.rows[0] ? mapRow(result.rows[0]) : undefined;
  }

  async markRunning(jobId: string): Promise<SyncJob> {
    return this.updateAndReturn(
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

  async markSucceeded(jobId: string, input: SyncJobCompletionInput = {}): Promise<SyncJob> {
    const current = await this.getById(jobId);
    return this.updateAndReturn(
      `UPDATE catalog_sync_jobs
       SET status = 'succeeded',
        finished_at = NOW(),
        last_error = NULL,
        metadata = $2
       WHERE id = $1 AND status = 'running'
       RETURNING *`,
      [jobId, JSON.stringify(mergeMetadata(current.metadata, input.metadata))],
    );
  }

  async markFailed(jobId: string, input: SyncJobFailureInput): Promise<SyncJob> {
    const current = await this.getById(jobId);
    return this.updateAndReturn(
      `UPDATE catalog_sync_jobs
       SET status = 'failed',
        finished_at = NOW(),
        last_error = $2,
        metadata = $3
       WHERE id = $1 AND status = 'running'
       RETURNING *`,
      [jobId, input.error, JSON.stringify(mergeMetadata(current.metadata, input.metadata))],
    );
  }

  async cancel(jobId: string, reason?: string): Promise<SyncJob> {
    const current = await this.getById(jobId);
    return this.updateAndReturn(
      `UPDATE catalog_sync_jobs
       SET status = 'cancelled',
        finished_at = NOW(),
        last_error = $2,
        metadata = $3
       WHERE id = $1 AND status IN ('pending', 'running')
       RETURNING *`,
      [
        jobId,
        reason,
        JSON.stringify(mergeMetadata(current.metadata, reason ? { cancelReason: reason } : undefined)),
      ],
    );
  }

  async incrementAttempt(jobId: string): Promise<SyncJob> {
    return this.updateAndReturn(
      `UPDATE catalog_sync_jobs
       SET attempt_count = attempt_count + 1
       WHERE id = $1
       RETURNING *`,
      [jobId],
    );
  }

  private async findActiveForEntity(
    entityType: SyncJobEntityType,
    entityId: string,
    provider: CatalogProvenanceProvider,
  ): Promise<SyncJob | undefined> {
    const result = await this.pool.query<SyncJobRow>(
      `SELECT * FROM catalog_sync_jobs
       WHERE entity_type = $1 AND entity_id = $2 AND provider = $3
        AND status IN ('pending', 'running')
       ORDER BY created_at ASC
       LIMIT 1`,
      [entityType, entityId, provider],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : undefined;
  }

  private async getById(jobId: string): Promise<SyncJob> {
    const result = await this.pool.query<SyncJobRow>(
      "SELECT * FROM catalog_sync_jobs WHERE id = $1",
      [jobId],
    );
    if (!result.rows[0]) {
      throw new Error(`Sync job not found: ${jobId}`);
    }
    return mapRow(result.rows[0]);
  }

  private async updateAndReturn(query: string, params: unknown[]): Promise<SyncJob> {
    const result = await this.pool.query<SyncJobRow>(query, params);
    if (!result.rows[0]) {
      throw new Error("Sync job state transition was not applied.");
    }
    return mapRow(result.rows[0]);
  }
}

export type SyncJobTransactionClient = PoolClient;

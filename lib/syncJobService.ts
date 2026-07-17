import type { CatalogSyncInput, CatalogSyncResult } from "@/types/catalogSync";
import type {
  CreateSyncJobInput,
  SyncJob,
  SyncJobFailureInput,
  SyncJobRepository,
  SyncJobRunResult,
} from "@/types/syncJob";

export type SyncJobRunner<T = CatalogSyncResult> = (job: SyncJob) => Promise<T>;

export class SyncJobService {
  constructor(private readonly repository: SyncJobRepository) {}

  createJob(input: CreateSyncJobInput): Promise<SyncJob> {
    return this.repository.create(input);
  }

  createCatalogSyncJob(input: CatalogSyncInput): Promise<SyncJob> {
    return this.createJob({
      entityType: "movie",
      entityId: input.canonicalMovie.id,
      provider: input.provenance.provider,
      priority: input.qualityScore >= 95 ? "normal" : "low",
      metadata: {
        syncMode: input.syncMode,
        sourceVersion: input.sourceVersion,
        requestedBy: input.requestedBy,
        qualityScore: input.qualityScore,
      },
    });
  }

  findPending(limit?: number): Promise<SyncJob[]> {
    return this.repository.findPending(limit);
  }

  findRunning(limit?: number): Promise<SyncJob[]> {
    return this.repository.findRunning(limit);
  }

  markRunning(jobId: string): Promise<SyncJob> {
    return this.repository.markRunning(jobId);
  }

  markSucceeded(jobId: string, metadata?: SyncJob["metadata"]): Promise<SyncJob> {
    return this.repository.markSucceeded(jobId, { metadata });
  }

  markFailed(jobId: string, input: SyncJobFailureInput): Promise<SyncJob> {
    return this.repository.markFailed(jobId, input);
  }

  incrementAttempt(jobId: string): Promise<SyncJob> {
    return this.repository.incrementAttempt(jobId);
  }

  cancel(jobId: string, reason?: string): Promise<SyncJob> {
    return this.repository.cancel(jobId, reason);
  }

  async runJob<T = CatalogSyncResult>(jobId: string, runner: SyncJobRunner<T>): Promise<SyncJobRunResult<T>> {
    const runningJob = await this.repository.markRunning(jobId);
    const attemptedJob = await this.repository.incrementAttempt(runningJob.id);

    try {
      const result = await runner(attemptedJob);
      const succeededJob = await this.repository.markSucceeded(attemptedJob.id, {
        metadata: { completedBy: "SyncJobService" },
      });
      return { job: succeededJob, result };
    } catch (error) {
      const failedJob = await this.repository.markFailed(attemptedJob.id, {
        error: error instanceof Error ? error.message : String(error),
        metadata: { failedBy: "SyncJobService" },
      });
      throw Object.assign(error instanceof Error ? error : new Error(String(error)), {
        syncJob: failedJob,
      });
    }
  }
}

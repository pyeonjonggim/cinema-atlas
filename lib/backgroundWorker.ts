import "server-only";

import type {
  BackgroundWorkerJobResult,
  BackgroundWorkerReport,
  RunnerRegistry,
} from "@/types/backgroundWorker";
import type { SyncJobDispatcher } from "@/types/syncJob";
import type { SyncJobService } from "@/lib/syncJobService";

function now() {
  return new Date().toISOString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class BackgroundWorker {
  constructor(
    private readonly dispatcher: SyncJobDispatcher,
    private readonly jobService: SyncJobService,
    private readonly runnerRegistry: RunnerRegistry,
  ) {}

  async runOnce(limit: number): Promise<BackgroundWorkerReport> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("runOnce limit must be a positive integer.");
    }

    const workerStartedAt = performance.now();
    const jobs = await this.dispatcher.dispatchBatch(limit);
    const jobResults: BackgroundWorkerJobResult[] = [];

    for (const job of jobs) {
      const startedAt = now();
      const jobStartedAt = performance.now();
      const runner = this.runnerRegistry.getRunner(job.entityType);

      try {
        if (!runner) {
          throw new Error(`No runner registered for entity type: ${job.entityType}`);
        }

        const attemptedJob = await this.jobService.incrementAttempt(job.id);
        const result = await runner.run(attemptedJob);
        await this.jobService.markSucceeded(attemptedJob.id, {
          worker: "BackgroundWorker",
          runner: runner.constructor.name,
          resultStatus: "status" in result ? result.status : "PASS",
          resultMetadata: "metadata" in result ? result.metadata : undefined,
        });

        jobResults.push({
          jobId: job.id,
          entityType: job.entityType,
          entityId: job.entityId,
          status: "succeeded",
          startedAt,
          finishedAt: now(),
          executionTimeMs: Number((performance.now() - jobStartedAt).toFixed(2)),
        });
      } catch (error) {
        await this.jobService.markFailed(job.id, {
          error: errorMessage(error),
          metadata: { worker: "BackgroundWorker" },
        });

        jobResults.push({
          jobId: job.id,
          entityType: job.entityType,
          entityId: job.entityId,
          status: "failed",
          error: errorMessage(error),
          startedAt,
          finishedAt: now(),
          executionTimeMs: Number((performance.now() - jobStartedAt).toFixed(2)),
        });
      }
    }

    const succeededJobs = jobResults.filter((result) => result.status === "succeeded").length;
    const failedJobs = jobResults.filter((result) => result.status === "failed").length;

    return {
      processedJobs: jobResults.length,
      succeededJobs,
      failedJobs,
      executionTimeMs: Number((performance.now() - workerStartedAt).toFixed(2)),
      jobResults,
    };
  }
}

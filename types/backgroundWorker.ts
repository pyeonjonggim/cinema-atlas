import type { CatalogSyncResult } from "@/types/catalogSync";
import type { SyncJob, SyncJobEntityType } from "@/types/syncJob";

export type BackgroundWorkerRunnerResult = CatalogSyncResult | {
  status: "PASS" | "NO_CHANGE";
  metadata?: Record<string, unknown>;
};

export type BackgroundWorkerRunner = {
  entityType: SyncJobEntityType;
  run(job: SyncJob): Promise<BackgroundWorkerRunnerResult>;
};

export type RunnerRegistry = {
  getRunner(entityType: SyncJobEntityType): BackgroundWorkerRunner | undefined;
};

export type BackgroundWorkerJobResult = {
  jobId: string;
  entityType: SyncJobEntityType;
  entityId: string;
  status: "succeeded" | "failed";
  error?: string;
  startedAt: string;
  finishedAt: string;
  executionTimeMs: number;
};

export type BackgroundWorkerReport = {
  processedJobs: number;
  succeededJobs: number;
  failedJobs: number;
  executionTimeMs: number;
  jobResults: BackgroundWorkerJobResult[];
};

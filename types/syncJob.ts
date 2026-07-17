import type { CatalogProvenanceProvider, KnowledgeGraphEntityType } from "@/types/catalogPersistence";

export type SyncJobEntityType = KnowledgeGraphEntityType;

export type SyncJobStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type SyncJobPriority = "low" | "normal" | "high";

export type SyncJobMetadata = Record<string, unknown>;

export type SyncJob = {
  id: string;
  entityType: SyncJobEntityType;
  entityId: string;
  provider: CatalogProvenanceProvider;
  status: SyncJobStatus;
  priority: SyncJobPriority;
  attemptCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  lastError?: string;
  metadata: SyncJobMetadata;
};

export type CreateSyncJobInput = {
  entityType: SyncJobEntityType;
  entityId: string;
  provider: CatalogProvenanceProvider;
  priority?: SyncJobPriority;
  metadata?: SyncJobMetadata;
};

export type SyncJobCompletionInput = {
  metadata?: SyncJobMetadata;
};

export type SyncJobFailureInput = {
  error: string;
  metadata?: SyncJobMetadata;
};

export type SyncJobRepository = {
  create(input: CreateSyncJobInput): Promise<SyncJob>;
  findPending(limit?: number): Promise<SyncJob[]>;
  findRunning(limit?: number): Promise<SyncJob[]>;
  reserveNext(): Promise<SyncJob | undefined>;
  reserveBatch(limit: number): Promise<SyncJob[]>;
  findLatestForEntity(
    entityType: SyncJobEntityType,
    entityId: string,
    provider?: CatalogProvenanceProvider,
  ): Promise<SyncJob | undefined>;
  markRunning(jobId: string): Promise<SyncJob>;
  markSucceeded(jobId: string, input?: SyncJobCompletionInput): Promise<SyncJob>;
  markFailed(jobId: string, input: SyncJobFailureInput): Promise<SyncJob>;
  cancel(jobId: string, reason?: string): Promise<SyncJob>;
  incrementAttempt(jobId: string): Promise<SyncJob>;
};

export type SyncJobRunResult<T = unknown> = {
  job: SyncJob;
  result?: T;
};

export type SyncJobDispatcher = {
  dispatchNext(): Promise<SyncJob | undefined>;
  dispatchBatch(limit: number): Promise<SyncJob[]>;
  peekNext(limit?: number): Promise<SyncJob[]>;
};

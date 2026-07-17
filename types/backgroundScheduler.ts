import type { BackgroundWorkerReport } from "@/types/backgroundWorker";

export type BackgroundSchedulerConfig = {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
};

export type BackgroundSchedulerExecutionLog = {
  id: string;
  startedAt: string;
  finishedAt: string;
  skipped: boolean;
  skipReason?: "disabled" | "worker-running";
  processedJobs: number;
  succeededJobs: number;
  failedJobs: number;
  executionTimeMs: number;
};

export type BackgroundSchedulerReport = {
  schedulerStarted: boolean;
  workerTriggered: boolean;
  skipped: boolean;
  skipReason?: BackgroundSchedulerExecutionLog["skipReason"];
  processedJobs: number;
  succeededJobs: number;
  failedJobs: number;
  executionTimeMs: number;
  workerReport?: BackgroundWorkerReport;
  executionLog: BackgroundSchedulerExecutionLog;
};

export type ScheduledWorker = {
  runOnce(limit: number): Promise<BackgroundWorkerReport>;
};

import "server-only";

import { randomUUID } from "node:crypto";

import type {
  BackgroundSchedulerConfig,
  BackgroundSchedulerExecutionLog,
  BackgroundSchedulerReport,
  ScheduledWorker,
} from "@/types/backgroundScheduler";

function now() {
  return new Date().toISOString();
}

export const defaultBackgroundSchedulerConfig: BackgroundSchedulerConfig = {
  enabled: true,
  intervalMs: 15 * 60 * 1000,
  batchSize: 10,
};

export class BackgroundScheduler {
  private running = false;
  private readonly logs: BackgroundSchedulerExecutionLog[] = [];

  constructor(
    private readonly worker: ScheduledWorker,
    private readonly config: BackgroundSchedulerConfig = defaultBackgroundSchedulerConfig,
  ) {}

  getExecutionLogs(): BackgroundSchedulerExecutionLog[] {
    return [...this.logs];
  }

  isRunning(): boolean {
    return this.running;
  }

  async runOnce(): Promise<BackgroundSchedulerReport> {
    const startedAt = now();
    const started = performance.now();

    if (!this.config.enabled) {
      return this.recordSkipped(startedAt, started, "disabled");
    }

    if (this.running) {
      return this.recordSkipped(startedAt, started, "worker-running");
    }

    this.running = true;

    try {
      const workerReport = await this.worker.runOnce(this.config.batchSize);
      const executionTimeMs = Number((performance.now() - started).toFixed(2));
      const executionLog: BackgroundSchedulerExecutionLog = {
        id: `scheduler_log_${randomUUID()}`,
        startedAt,
        finishedAt: now(),
        skipped: false,
        processedJobs: workerReport.processedJobs,
        succeededJobs: workerReport.succeededJobs,
        failedJobs: workerReport.failedJobs,
        executionTimeMs,
      };
      this.logs.push(executionLog);

      return {
        schedulerStarted: true,
        workerTriggered: true,
        skipped: false,
        processedJobs: workerReport.processedJobs,
        succeededJobs: workerReport.succeededJobs,
        failedJobs: workerReport.failedJobs,
        executionTimeMs,
        workerReport,
        executionLog,
      };
    } finally {
      this.running = false;
    }
  }

  private recordSkipped(
    startedAt: string,
    started: number,
    skipReason: NonNullable<BackgroundSchedulerExecutionLog["skipReason"]>,
  ): BackgroundSchedulerReport {
    const executionTimeMs = Number((performance.now() - started).toFixed(2));
    const executionLog: BackgroundSchedulerExecutionLog = {
      id: `scheduler_log_${randomUUID()}`,
      startedAt,
      finishedAt: now(),
      skipped: true,
      skipReason,
      processedJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      executionTimeMs,
    };
    this.logs.push(executionLog);

    return {
      schedulerStarted: true,
      workerTriggered: false,
      skipped: true,
      skipReason,
      processedJobs: 0,
      succeededJobs: 0,
      failedJobs: 0,
      executionTimeMs,
      executionLog,
    };
  }
}

import type {
  BackgroundWorkerRunner,
  RunnerRegistry,
} from "@/types/backgroundWorker";
import type { SyncJobEntityType } from "@/types/syncJob";

export class StaticRunnerRegistry implements RunnerRegistry {
  private readonly runners = new Map<SyncJobEntityType, BackgroundWorkerRunner>();

  constructor(runners: BackgroundWorkerRunner[]) {
    runners.forEach((runner) => {
      this.runners.set(runner.entityType, runner);
    });
  }

  getRunner(entityType: SyncJobEntityType): BackgroundWorkerRunner | undefined {
    return this.runners.get(entityType);
  }
}

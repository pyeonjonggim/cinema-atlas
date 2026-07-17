import { CatalogSyncService } from "@/lib/catalogSync";
import type {
  BackgroundWorkerRunner,
  BackgroundWorkerRunnerResult,
} from "@/types/backgroundWorker";
import type { SyncJob } from "@/types/syncJob";

export type MovieSyncRunnerExecutor = (
  job: SyncJob,
  catalogSyncService: CatalogSyncService,
) => Promise<BackgroundWorkerRunnerResult>;

export class MovieSyncRunner implements BackgroundWorkerRunner {
  readonly entityType = "movie" as const;

  constructor(
    private readonly catalogSyncService = new CatalogSyncService(),
    private readonly executor: MovieSyncRunnerExecutor = async (job, service) => ({
      status: "PASS",
      metadata: {
        entityId: job.entityId,
        catalogSyncService: service.constructor.name,
        note: "CatalogSyncService boundary reached. Provider payload execution is supplied by the worker host.",
      },
    }),
  ) {}

  run(job: SyncJob): Promise<BackgroundWorkerRunnerResult> {
    return this.executor(job, this.catalogSyncService);
  }
}

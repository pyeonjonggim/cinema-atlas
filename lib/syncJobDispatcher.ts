import "server-only";

import type { SyncJob, SyncJobDispatcher as SyncJobDispatcherContract, SyncJobRepository } from "@/types/syncJob";

export class SyncJobDispatcher implements SyncJobDispatcherContract {
  constructor(private readonly repository: SyncJobRepository) {}

  peekNext(limit = 25): Promise<SyncJob[]> {
    return this.repository.findPending(limit);
  }

  dispatchNext(): Promise<SyncJob | undefined> {
    return this.repository.reserveNext();
  }

  dispatchBatch(limit: number): Promise<SyncJob[]> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("dispatchBatch limit must be a positive integer.");
    }
    return this.repository.reserveBatch(limit);
  }
}

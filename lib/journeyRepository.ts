import type {
  JourneyCatalogStatus,
  JourneyRecord,
  JourneyRecordInput,
  JourneyRepository,
  JourneyStep,
  SavedJourneyRecord,
} from "@/types/journey";

const DEFAULT_TIMESTAMP = "2026-07-24T00:00:00.000Z";

export class InMemoryJourneyRepository implements JourneyRepository {
  private readonly journeysById = new Map<string, JourneyRecord>();
  private readonly stepsByJourneyId = new Map<string, JourneyStep[]>();
  private readonly savedJourneysById = new Map<string, SavedJourneyRecord>();
  private readonly savedJourneyIdsByJourneyId = new Map<string, string>();

  async getJourneyById(id: string): Promise<JourneyRecord | undefined> {
    return this.journeysById.get(id);
  }

  async listJourneys(
    options: Parameters<JourneyRepository["listJourneys"]>[0] = {}
  ): Promise<JourneyRecord[]> {
    return [...this.journeysById.values()]
      .filter((journey) =>
        options.catalogStatus ? journey.catalogStatus === options.catalogStatus : true
      )
      .filter((journey) =>
        options.visibility ? journey.visibility === options.visibility : true
      )
      .filter((journey) =>
        typeof options.official === "boolean"
          ? journey.official === options.official
          : true
      )
      .sort((left, right) => left.title.localeCompare(right.title));
  }

  async listJourneySteps(journeyId: string): Promise<JourneyStep[]> {
    return [...(this.stepsByJourneyId.get(journeyId) ?? [])].sort(
      (left, right) => left.order - right.order
    );
  }

  async upsertJourney(
    input: JourneyRecordInput,
    steps: JourneyStep[]
  ): Promise<JourneyRecord> {
    const existing = this.journeysById.get(input.id);
    const now = input.updatedAt ?? DEFAULT_TIMESTAMP;
    const record: JourneyRecord = {
      ...input,
      revision: input.revision ?? (existing ? existing.revision + 1 : 1),
      createdAt: input.createdAt ?? existing?.createdAt ?? DEFAULT_TIMESTAMP,
      updatedAt: now,
    };

    assertUniqueStepIds(input.id, steps);
    this.journeysById.set(record.id, record);
    this.stepsByJourneyId.set(
      record.id,
      steps
        .map((step) => ({ ...step, journeyId: record.id }))
        .sort((left, right) => left.order - right.order)
    );

    return record;
  }

  async updateJourneyStatus(
    journeyId: string,
    catalogStatus: JourneyCatalogStatus
  ): Promise<JourneyRecord> {
    const existing = this.journeysById.get(journeyId);
    if (!existing) {
      throw new Error(`Journey does not exist: ${journeyId}`);
    }

    const updated: JourneyRecord = {
      ...existing,
      catalogStatus,
      revision: existing.revision + 1,
      updatedAt: DEFAULT_TIMESTAMP,
    };
    this.journeysById.set(journeyId, updated);
    return updated;
  }

  async publishJourney(journeyId: string): Promise<JourneyRecord> {
    const existing = this.journeysById.get(journeyId);
    if (!existing) {
      throw new Error(`Journey does not exist: ${journeyId}`);
    }

    const updated: JourneyRecord = {
      ...existing,
      catalogStatus: "published",
      visibility: "public",
      official: true,
      revision: existing.revision + 1,
      updatedAt: DEFAULT_TIMESTAMP,
    };
    this.journeysById.set(journeyId, updated);
    return updated;
  }

  async saveJourney(record: SavedJourneyRecord): Promise<SavedJourneyRecord> {
    const existingId = this.savedJourneyIdsByJourneyId.get(record.journeyId);
    const existing = existingId ? this.savedJourneysById.get(existingId) : undefined;
    const savedRecord: SavedJourneyRecord = existing
      ? {
          ...existing,
          status: record.status,
          currentStepId: record.currentStepId,
          updatedAt: record.updatedAt,
        }
      : record;

    this.savedJourneysById.set(savedRecord.id, savedRecord);
    this.savedJourneyIdsByJourneyId.set(savedRecord.journeyId, savedRecord.id);
    return savedRecord;
  }

  async listSavedJourneys(): Promise<SavedJourneyRecord[]> {
    return [...this.savedJourneysById.values()].sort((left, right) =>
      left.savedAt.localeCompare(right.savedAt)
    );
  }

  snapshot() {
    return {
      journeys: [...this.journeysById.values()],
      steps: [...this.stepsByJourneyId.values()].flat(),
      savedJourneys: [...this.savedJourneysById.values()],
    };
  }
}

function assertUniqueStepIds(journeyId: string, steps: JourneyStep[]) {
  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.id)) {
      throw new Error(`Duplicate step id for ${journeyId}: ${step.id}`);
    }
    seen.add(step.id);
  }
}

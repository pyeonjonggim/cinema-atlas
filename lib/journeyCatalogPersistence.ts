import { journeySteps, journeys } from "@/data/journeys";
import { buildJourneyCandidates } from "@/lib/journeyFactory";
import type {
  JourneyCandidate,
  JourneyCatalogStatus,
  JourneyRecordInput,
  JourneyRepository,
  JourneyStep,
} from "@/types/journey";

const JOURNEY_CATALOG_TIMESTAMP = "2026-07-24T00:00:00.000Z";

export async function seedJourneyCatalogRepository(
  repository: JourneyRepository
) {
  for (const journey of journeys) {
    await repository.upsertJourney(
      {
        ...journey,
        catalogStatus: "published",
        revision: 1,
        createdAt: JOURNEY_CATALOG_TIMESTAMP,
        updatedAt: JOURNEY_CATALOG_TIMESTAMP,
      },
      journeySteps.filter((step) => step.journeyId === journey.id)
    );
  }

  for (const candidate of buildJourneyCandidates()) {
    await repository.upsertJourney(
      createJourneyRecordFromCandidate(candidate),
      candidate.steps
    );
  }

  return repository.snapshot();
}

export function createJourneyRecordFromCandidate(
  candidate: JourneyCandidate
): JourneyRecordInput {
  return {
    id: candidate.id,
    title: candidate.title,
    subtitle: "A generated Journey candidate awaiting editorial review.",
    description: candidate.reason,
    category: candidate.category,
    difficulty: candidate.computedDifficulty,
    estimatedMovies: candidate.movieCount,
    estimatedHours: Math.max(2, candidate.movieCount * 2),
    official: false,
    authorType: "cinema-atlas",
    author: "Cinema Atlas Factory",
    visibility: "unlisted",
    tags: ["Journey Candidate", "Editorial Review"],
    stepIds: candidate.steps.map((step) => step.id),
    catalogStatus: getCatalogStatusForCandidate(candidate),
    revision: 1,
    createdAt: JOURNEY_CATALOG_TIMESTAMP,
    updatedAt: JOURNEY_CATALOG_TIMESTAMP,
  };
}

export function createSavedJourneyRecord(journeyId: string, currentStepId?: string) {
  return {
    id: `saved-${journeyId}`,
    journeyId,
    status: currentStepId ? "in_progress" : "saved",
    currentStepId,
    savedAt: JOURNEY_CATALOG_TIMESTAMP,
    updatedAt: JOURNEY_CATALOG_TIMESTAMP,
  } as const;
}

export function validateJourneyCatalogSnapshot(snapshot: {
  journeys: JourneyRecordInput[];
  steps: JourneyStep[];
}) {
  const issues: string[] = [];
  const journeyIds = new Set(snapshot.journeys.map((journey) => journey.id));
  const duplicateJourneyIds = duplicates(snapshot.journeys.map((journey) => journey.id));
  const duplicateStepIds = duplicates(snapshot.steps.map((step) => step.id));

  duplicateJourneyIds.forEach((id) => issues.push(`Duplicate journey id: ${id}`));
  duplicateStepIds.forEach((id) => issues.push(`Duplicate step id: ${id}`));

  for (const step of snapshot.steps) {
    if (!journeyIds.has(step.journeyId)) {
      issues.push(`Step points to missing journey: ${step.id} -> ${step.journeyId}`);
    }
  }

  for (const journey of snapshot.journeys) {
    const steps = snapshot.steps.filter((step) => step.journeyId === journey.id);
    if (journey.catalogStatus === "published" && journey.visibility !== "public") {
      issues.push(`Published journey is not public: ${journey.id}`);
    }
    if (journey.catalogStatus !== "published" && journey.visibility === "public") {
      issues.push(`Unpublished journey is public: ${journey.id}`);
    }
    if (steps.length !== journey.stepIds.length) {
      issues.push(`Journey step count mismatch: ${journey.id}`);
    }
  }

  return issues;
}

function getCatalogStatusForCandidate(
  candidate: JourneyCandidate
): JourneyCatalogStatus {
  if (candidate.status === "rejected") return "archived";
  if (candidate.status === "draft") return "draft";
  return "review";
}

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

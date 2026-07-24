import { InMemoryJourneyRepository } from "@/lib/journeyRepository";
import { seedJourneyCatalogRepository } from "@/lib/journeyCatalogPersistence";
import { resolveJourneyStep } from "@/lib/journeys";
import { computeJourneyDifficulty } from "@/lib/journeyDifficulty";
import type {
  Journey,
  JourneyDiscoveryCriteria,
  JourneyProjection,
  JourneyRepository,
  JourneyStep,
} from "@/types/journey";

type ScoredJourney = {
  journey: JourneyProjection;
  score: number;
};

let repositoryPromise: Promise<JourneyRepository> | undefined;

export async function getJourneyRepository() {
  if (!repositoryPromise) {
    repositoryPromise = createSeededJourneyRepository();
  }

  return repositoryPromise;
}

export async function listPublishedJourneys(): Promise<JourneyProjection[]> {
  const repository = await getJourneyRepository();
  const journeys = await repository.listJourneys({
    catalogStatus: "published",
    visibility: "public",
  });

  return Promise.all(journeys.map((journey) => toJourneyProjection(repository, journey)));
}

export async function listGeneratedJourneyCandidates(): Promise<JourneyProjection[]> {
  const repository = await getJourneyRepository();
  const reviewJourneys = await repository.listJourneys({
    catalogStatus: "review",
    visibility: "unlisted",
  });
  const draftJourneys = await repository.listJourneys({
    catalogStatus: "draft",
    visibility: "unlisted",
  });
  const candidates = [...reviewJourneys, ...draftJourneys].sort((left, right) => {
    if (left.catalogStatus !== right.catalogStatus) {
      return left.catalogStatus === "review" ? -1 : 1;
    }
    return left.title.localeCompare(right.title);
  });

  return Promise.all(
    candidates.map((journey) => toJourneyProjection(repository, journey))
  );
}

export async function getPublishedJourneyById(
  journeyId: string
): Promise<JourneyProjection | undefined> {
  const repository = await getJourneyRepository();
  const journey = await repository.getJourneyById(journeyId);

  if (
    !journey ||
    journey.catalogStatus !== "published" ||
    journey.visibility !== "public"
  ) {
    return undefined;
  }

  return toJourneyProjection(repository, journey);
}

export async function getGeneratedJourneyCandidateById(
  candidateId: string
): Promise<JourneyProjection | undefined> {
  const repository = await getJourneyRepository();
  const journey = await repository.getJourneyById(candidateId);

  if (!journey || journey.visibility !== "unlisted") {
    return undefined;
  }

  if (journey.catalogStatus !== "review" && journey.catalogStatus !== "draft") {
    return undefined;
  }

  return toJourneyProjection(repository, journey);
}

export async function getResolvedJourneySteps(journey: JourneyProjection) {
  return journey.steps.map(resolveJourneyStep);
}

export async function getRelatedPublishedJourneys(
  currentJourney: JourneyProjection,
  limit = 4
) {
  const publishedJourneys = await listPublishedJourneys();
  const currentEntityIds = new Set(currentJourney.steps.map((step) => step.entityId));
  const currentEntitiesByType = groupEntityIdsByType(currentJourney.steps);

  return publishedJourneys
    .filter((journey) => journey.id !== currentJourney.id)
    .map((journey) => {
      const entitiesByType = groupEntityIdsByType(journey.steps);
      const sharedEntityCount = journey.steps.filter((step) =>
        currentEntityIds.has(step.entityId)
      ).length;

      let score = 0;
      if (journey.category === currentJourney.category) score += 30;
      score += countShared(currentEntitiesByType.country, entitiesByType.country) * 18;
      score +=
        countShared(currentEntitiesByType.movement, entitiesByType.movement) * 16;
      score +=
        countShared(currentEntitiesByType.director, entitiesByType.director) * 14;
      if (journey.difficulty === currentJourney.difficulty) score += 8;
      score += sharedEntityCount * 2;

      const overlapRatio =
        journey.steps.length > 0
          ? sharedEntityCount / Math.max(journey.steps.length, 1)
          : 0;
      if (overlapRatio > 0.5) score -= 20;

      return { journey, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.journey.title.localeCompare(right.journey.title);
    })
    .map((item) => item.journey)
    .slice(0, limit);
}

export async function selectPublishedJourneys(
  criteria: JourneyDiscoveryCriteria = {}
) {
  const limit = criteria.limit ?? 3;
  const seed = criteria.seed ?? "cinema-atlas";
  const journeys = await listPublishedJourneys();

  return journeys
    .map((journey) => ({
      journey,
      score: scoreJourney(journey, criteria, seed),
    }))
    .filter(({ score }) => score > Number.NEGATIVE_INFINITY)
    .sort(sortScoredJourneys)
    .map(({ journey }) => journey)
    .slice(0, limit);
}

export async function selectFeaturedPublishedJourney(
  criteria: JourneyDiscoveryCriteria = {}
) {
  return (await selectPublishedJourneys({ ...criteria, limit: 1 }))[0];
}

async function createSeededJourneyRepository() {
  const repository = new InMemoryJourneyRepository();
  await seedJourneyCatalogRepository(repository);
  return repository;
}

async function toJourneyProjection(
  repository: JourneyRepository,
  journey: Journey
): Promise<JourneyProjection> {
  const steps = await repository.listJourneySteps(journey.id);
  return {
    ...journey,
    steps,
  } as JourneyProjection;
}

function scoreJourney(
  journey: JourneyProjection,
  criteria: JourneyDiscoveryCriteria,
  seed: string
) {
  const stepCount = journey.steps.length;

  if (criteria.category && journey.category !== criteria.category) {
    return Number.NEGATIVE_INFINITY;
  }

  if (
    criteria.difficulty &&
    computeJourneyDifficulty(journey) !== criteria.difficulty
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  if (criteria.minSteps && stepCount < criteria.minSteps) {
    return Number.NEGATIVE_INFINITY;
  }

  if (criteria.maxSteps && stepCount > criteria.maxSteps) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  if (journey.official) score += 100;
  score += stepCount * 8;
  score += journey.estimatedMovies * 6;

  if (criteria.purpose === "daily-feature") score += 40;
  if (criteria.purpose === "short-route" && journey.estimatedHours <= 6) {
    score += 30;
  }
  if (criteria.purpose === "deep-route" && stepCount >= 10) score += 30;

  return score + seededTieBreaker(`${seed}:${journey.id}`);
}

function sortScoredJourneys(left: ScoredJourney, right: ScoredJourney) {
  if (right.score !== left.score) return right.score - left.score;
  return left.journey.title.localeCompare(right.journey.title);
}

function seededTieBreaker(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function groupEntityIdsByType(steps: JourneyStep[]) {
  return steps.reduce(
    (groups, step) => {
      groups[step.entityType].add(step.entityId);
      return groups;
    },
    {
      movie: new Set<string>(),
      director: new Set<string>(),
      actor: new Set<string>(),
      country: new Set<string>(),
      movement: new Set<string>(),
      award: new Set<string>(),
    }
  );
}

function countShared(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((value) => {
    if (right.has(value)) count += 1;
  });
  return count;
}

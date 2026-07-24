import { journeys, journeySteps } from "@/data/journeys";
import { computeJourneyDifficulty } from "@/lib/journeyDifficulty";
import type { Journey, JourneyDiscoveryCriteria } from "@/types/journey";

type ScoredJourney = {
  journey: Journey;
  score: number;
};

export function selectJourneys(criteria: JourneyDiscoveryCriteria = {}) {
  const limit = criteria.limit ?? 3;
  const seed = criteria.seed ?? "cinema-atlas";

  return journeys
    .filter((journey) => journey.visibility === "public")
    .map((journey) => ({
      journey,
      score: scoreJourney(journey, criteria, seed),
    }))
    .filter(({ score }) => score > Number.NEGATIVE_INFINITY)
    .sort(sortScoredJourneys)
    .map(({ journey }) => journey)
    .slice(0, limit);
}

export function selectFeaturedJourney(criteria: JourneyDiscoveryCriteria = {}) {
  return selectJourneys({ ...criteria, limit: 1 })[0];
}

export function getJourneyStepCount(journey: Journey) {
  return journeySteps.filter((step) => journey.stepIds.includes(step.id)).length;
}

function scoreJourney(
  journey: Journey,
  criteria: JourneyDiscoveryCriteria,
  seed: string
) {
  const stepCount = getJourneyStepCount(journey);

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
  if (criteria.purpose === "short-route" && journey.estimatedHours <= 6) score += 30;
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

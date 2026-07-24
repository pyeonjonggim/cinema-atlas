import { journeyBlueprints } from "@/data/journeyBlueprints";
import { journeySteps, journeys } from "@/data/journeys";
import { scoreJourneyDifficulty } from "@/lib/journeyDifficulty";
import { validateJourneyNameDifficulty } from "@/lib/journeyNamingQuality";
import {
  createSimilarityProfile,
  findJourneySimilarityMatches,
} from "@/lib/journeySimilarity";
import type {
  Journey,
  JourneyBlueprint,
  JourneyCandidate,
  JourneyStep,
} from "@/types/journey";

export function buildJourneyCandidates(
  blueprints: JourneyBlueprint[] = journeyBlueprints
): JourneyCandidate[] {
  const candidates = blueprints.map(buildJourneyCandidate);
  return applyCrossJourneyQualityIssues(candidates, blueprints);
}

export function buildJourneyCandidate(
  blueprint: JourneyBlueprint
): JourneyCandidate {
  const candidateJourney = createCandidateJourneyShell(blueprint);
  const steps = blueprint.anchors.map((anchor, index) => ({
    id: `${blueprint.id}-${index + 1}-${anchor.entityType}-${anchor.entityId}`,
    journeyId: candidateJourney.id,
    order: index + 1,
    entityType: anchor.entityType,
    entityId: anchor.entityId,
    learningGoal: createLearningGoal(anchor.role, anchor.entityType, anchor.entityId),
  }));
  const movieCount = steps.filter((step) => step.entityType === "movie").length;
  const difficulty = scoreJourneyDifficulty(
    {
      ...candidateJourney,
      stepIds: steps.map((step) => step.id),
    },
    steps
  );
  const validationIssues = [
    ...validateJourneyCandidate(blueprint, steps),
    ...validateJourneyNameDifficulty(
      candidateJourney,
      difficulty.computedDifficulty
    ),
  ];
  const status = getCandidateStatus(blueprint, validationIssues);

  return {
    id: candidateJourney.id,
    blueprintId: blueprint.id,
    title: blueprint.title,
    category: blueprint.category,
    status,
    reason: blueprint.editorialIntent,
    steps,
    movieCount,
    stepCount: steps.length,
    computedDifficulty: difficulty.computedDifficulty,
    difficultyScore: difficulty.score,
    validationIssues,
  };
}

function applyCrossJourneyQualityIssues(
  candidates: JourneyCandidate[],
  blueprints: JourneyBlueprint[]
) {
  const publishedProfiles = journeys.map((journey) => {
    return createSimilarityProfile(
      journey.id,
      journey.title,
      "published",
      journeySteps.filter((step) => step.journeyId === journey.id)
    );
  });
  const candidateProfiles = candidates.map((candidate) => {
    return createSimilarityProfile(
      candidate.id,
      candidate.title,
      "candidate",
      candidate.steps
    );
  });
  const matches = findJourneySimilarityMatches([
    ...publishedProfiles,
    ...candidateProfiles,
  ]);

  return candidates.map((candidate) => {
    const qualityIssues = matches
      .filter((match) => {
        return (
          match.leftJourneyId === candidate.id ||
          match.rightJourneyId === candidate.id
        );
      })
      .map((match) => match.issue);
    const validationIssues = unique([
      ...candidate.validationIssues,
      ...qualityIssues,
    ]);

    if (validationIssues.length === candidate.validationIssues.length) {
      return candidate;
    }

    const blueprint = blueprints.find((item) => item.id === candidate.blueprintId);

    return {
      ...candidate,
      validationIssues,
      status: getCandidateStatus(
        blueprint ?? {
          id: candidate.blueprintId,
          title: candidate.title,
          category: candidate.category,
          status: "review",
          source: "editorial",
          editorialIntent: candidate.reason,
          minMovieStops: candidate.movieCount,
          targetStepCount: candidate.stepCount,
          anchors: [],
          tags: [],
        },
        validationIssues
      ),
    };
  });
}

export function validateJourneyCandidate(
  blueprint: JourneyBlueprint,
  steps: JourneyStep[]
) {
  const issues: string[] = [];
  const movieCount = steps.filter((step) => step.entityType === "movie").length;
  const duplicateEntities = findDuplicates(
    steps.map((step) => `${step.entityType}:${step.entityId}`)
  );
  const knownStepEntities = new Set(
    journeySteps.map((step) => `${step.entityType}:${step.entityId}`)
  );
  const unknownEntities = steps.filter(
    (step) => !knownStepEntities.has(`${step.entityType}:${step.entityId}`)
  );

  if (steps.length < Math.min(blueprint.targetStepCount, 8)) {
    issues.push(
      `Candidate is too short: ${steps.length}/${blueprint.targetStepCount} target steps.`
    );
  }

  if (movieCount < blueprint.minMovieStops) {
    issues.push(
      `Candidate is not film-forward enough: ${movieCount}/${blueprint.minMovieStops} required film stops.`
    );
  }

  if (movieCount < Math.ceil(steps.length / 2)) {
    issues.push(
      `Films should carry at least half of the route: ${movieCount}/${steps.length}.`
    );
  }

  if (duplicateEntities.length > 0) {
    issues.push(`Duplicate entity anchors: ${duplicateEntities.join(", ")}.`);
  }

  if (unknownEntities.length > 0) {
    issues.push(
      `Anchors not present in existing published journey data: ${unknownEntities
        .map((step) => `${step.entityType}:${step.entityId}`)
        .join(", ")}.`
    );
  }

  let contextRun = 0;
  for (const step of steps) {
    if (step.entityType === "movie") {
      contextRun = 0;
    } else {
      contextRun += 1;
    }

    if (contextRun > 3) {
      issues.push("More than three context stops appear before the next film stop.");
      break;
    }
  }

  return issues;
}

function createCandidateJourneyShell(blueprint: JourneyBlueprint): Journey {
  return {
    id: blueprint.id.replace(/^blueprint-/, "candidate-"),
    title: blueprint.title,
    subtitle: "A generated Journey candidate for editorial review.",
    description: blueprint.editorialIntent,
    category: blueprint.category,
    difficulty: "intermediate",
    estimatedMovies: blueprint.anchors.filter((anchor) => anchor.entityType === "movie")
      .length,
    estimatedHours: Math.max(
      2,
      blueprint.anchors.filter((anchor) => anchor.entityType === "movie").length * 2
    ),
    official: false,
    authorType: "cinema-atlas",
    author: "Cinema Atlas Factory",
    visibility: "unlisted",
    tags: blueprint.tags,
    stepIds: [],
  };
}

function createLearningGoal(
  role: JourneyBlueprint["anchors"][number]["role"],
  entityType: JourneyStep["entityType"],
  entityId: string
) {
  const title = titleizeSlug(entityId);
  if (role === "entry") return `Enter the route through ${title}.`;
  if (role === "context") return `Use ${title} as context before the next film stop.`;
  if (role === "exit") return `Use ${title} as the continuation point after the route.`;
  if (entityType === "movie") return `Watch ${title} as a core film stop.`;
  return `Study ${title} as a core context stop.`;
}

function getCandidateStatus(
  blueprint: JourneyBlueprint,
  validationIssues: string[]
): JourneyCandidate["status"] {
  if (blueprint.status === "archived") return "rejected";
  if (validationIssues.length > 0) return "needs-editorial-review";
  if (blueprint.status === "approved") return "ready-to-publish";
  return "draft";
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function titleizeSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

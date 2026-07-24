import type { JourneyStep } from "@/types/journey";

export type JourneySimilaritySeverity =
  | "exact-duplicate"
  | "near-duplicate"
  | "high-overlap"
  | "distinct";

export type JourneySimilarityProfile = {
  id: string;
  title: string;
  source: "published" | "candidate";
  steps: JourneyStep[];
};

export type JourneySimilarityMatch = {
  leftJourneyId: string;
  leftTitle: string;
  rightJourneyId: string;
  rightTitle: string;
  severity: JourneySimilaritySeverity;
  entityOverlap: number;
  movieOverlap: number;
  orderedPairOverlap: number;
  sharedEntities: string[];
  sharedMovies: string[];
  issue: string;
};

type JourneyFingerprint = {
  profile: JourneySimilarityProfile;
  entityRefs: string[];
  movieRefs: string[];
  orderedPairs: string[];
};

export function findJourneySimilarityMatches(
  profiles: JourneySimilarityProfile[]
): JourneySimilarityMatch[] {
  const fingerprints = profiles.map(createFingerprint);
  const matches: JourneySimilarityMatch[] = [];

  for (let leftIndex = 0; leftIndex < fingerprints.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < fingerprints.length;
      rightIndex += 1
    ) {
      const match = compareFingerprints(
        fingerprints[leftIndex],
        fingerprints[rightIndex]
      );

      if (match.severity !== "distinct") {
        matches.push(match);
      }
    }
  }

  return matches.sort(sortMatches);
}

export function createSimilarityProfile(
  id: string,
  title: string,
  source: JourneySimilarityProfile["source"],
  steps: JourneyStep[]
): JourneySimilarityProfile {
  return {
    id,
    title,
    source,
    steps: [...steps].sort((left, right) => left.order - right.order),
  };
}

function createFingerprint(profile: JourneySimilarityProfile): JourneyFingerprint {
  const sortedSteps = [...profile.steps].sort((left, right) => left.order - right.order);
  const entityRefs = sortedSteps.map(toEntityRef);
  const movieRefs = sortedSteps
    .filter((step) => step.entityType === "movie")
    .map(toEntityRef);
  const orderedPairs = entityRefs.slice(0, -1).map((ref, index) => {
    return `${ref}->${entityRefs[index + 1]}`;
  });

  return {
    profile,
    entityRefs,
    movieRefs,
    orderedPairs,
  };
}

function compareFingerprints(
  left: JourneyFingerprint,
  right: JourneyFingerprint
): JourneySimilarityMatch {
  const entityOverlap = jaccard(left.entityRefs, right.entityRefs);
  const movieOverlap = jaccard(left.movieRefs, right.movieRefs);
  const orderedPairOverlap = jaccard(left.orderedPairs, right.orderedPairs);
  const sharedEntities = intersection(left.entityRefs, right.entityRefs);
  const sharedMovies = intersection(left.movieRefs, right.movieRefs);
  const sameOrderedRoute =
    left.entityRefs.length === right.entityRefs.length &&
    left.entityRefs.every((ref, index) => ref === right.entityRefs[index]);
  const severity = classifySimilarity({
    sameOrderedRoute,
    entityOverlap,
    movieOverlap,
    orderedPairOverlap,
    sharedMovies: sharedMovies.length,
  });

  return {
    leftJourneyId: left.profile.id,
    leftTitle: left.profile.title,
    rightJourneyId: right.profile.id,
    rightTitle: right.profile.title,
    severity,
    entityOverlap,
    movieOverlap,
    orderedPairOverlap,
    sharedEntities,
    sharedMovies,
    issue: createIssue(left.profile, right.profile, severity),
  };
}

function classifySimilarity({
  sameOrderedRoute,
  entityOverlap,
  movieOverlap,
  orderedPairOverlap,
  sharedMovies,
}: {
  sameOrderedRoute: boolean;
  entityOverlap: number;
  movieOverlap: number;
  orderedPairOverlap: number;
  sharedMovies: number;
}): JourneySimilaritySeverity {
  if (sameOrderedRoute) return "exact-duplicate";

  if (
    entityOverlap >= 0.9 ||
    (movieOverlap >= 0.85 && orderedPairOverlap >= 0.7)
  ) {
    return "near-duplicate";
  }

  if (
    sharedMovies >= 3 &&
    (entityOverlap >= 0.6 || movieOverlap >= 0.6 || orderedPairOverlap >= 0.45)
  ) {
    return "high-overlap";
  }

  return "distinct";
}

function createIssue(
  left: JourneySimilarityProfile,
  right: JourneySimilarityProfile,
  severity: JourneySimilaritySeverity
) {
  if (severity === "exact-duplicate") {
    return `Exact duplicate Journey route: ${left.id} matches ${right.id}.`;
  }

  if (severity === "near-duplicate") {
    return `Near-duplicate Journey route: ${left.id} is too similar to ${right.id}.`;
  }

  if (severity === "high-overlap") {
    return `High Journey overlap: ${left.id} shares substantial route material with ${right.id}.`;
  }

  return `Distinct Journey route: ${left.id} and ${right.id}.`;
}

function toEntityRef(step: JourneyStep) {
  return `${step.entityType}:${step.entityId}`;
}

function jaccard(leftValues: string[], rightValues: string[]) {
  const left = new Set(leftValues);
  const right = new Set(rightValues);
  const union = new Set([...left, ...right]);

  if (union.size === 0) return 0;
  return intersection([...left], [...right]).length / union.size;
}

function intersection(leftValues: string[], rightValues: string[]) {
  const right = new Set(rightValues);
  return [...new Set(leftValues)].filter((value) => right.has(value));
}

function sortMatches(left: JourneySimilarityMatch, right: JourneySimilarityMatch) {
  const severityRank: Record<JourneySimilaritySeverity, number> = {
    "exact-duplicate": 3,
    "near-duplicate": 2,
    "high-overlap": 1,
    distinct: 0,
  };

  if (severityRank[right.severity] !== severityRank[left.severity]) {
    return severityRank[right.severity] - severityRank[left.severity];
  }

  if (right.movieOverlap !== left.movieOverlap) {
    return right.movieOverlap - left.movieOverlap;
  }

  if (right.entityOverlap !== left.entityOverlap) {
    return right.entityOverlap - left.entityOverlap;
  }

  return `${left.leftJourneyId}:${left.rightJourneyId}`.localeCompare(
    `${right.leftJourneyId}:${right.rightJourneyId}`
  );
}

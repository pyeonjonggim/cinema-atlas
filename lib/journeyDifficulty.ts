import { journeySteps } from "@/data/journeys";
import type {
  Journey,
  JourneyDifficulty,
  JourneyDifficultyScore,
  JourneyMovieAccessibility,
  JourneyMovieAccessibilityTier,
  JourneyStep,
} from "@/types/journey";

type MovieAccessibilitySeed = Omit<JourneyMovieAccessibility, "movieId">;

const UNKNOWN_ACCESSIBILITY_SCORE = 60;

const movieAccessibilityRegistry: Record<string, MovieAccessibilitySeed> = {
  "bonnie-and-clyde": {
    tier: "canon",
    accessibilityScore: 35,
    releaseYear: 1967,
    reason: "Historically central, but less immediate than later blockbuster landmarks.",
  },
  casablanca: {
    tier: "well-known-canon",
    accessibilityScore: 15,
    releaseYear: 1942,
    reason: "A widely recognized Hollywood classic with strong general-audience awareness.",
  },
  "easy-rider": {
    tier: "canon",
    accessibilityScore: 35,
    releaseYear: 1969,
    reason: "Canonical counterculture cinema that benefits from movement context.",
  },
  jaws: {
    tier: "mainstream",
    accessibilityScore: 10,
    releaseYear: 1975,
    reason: "A broadly familiar modern blockbuster foundation.",
  },
  "late-spring": {
    tier: "specialist",
    accessibilityScore: 55,
    releaseYear: 1949,
    reason: "Essential Ozu, but quieter and more formally restrained for new viewers.",
  },
  "memories-of-murder": {
    tier: "canon",
    accessibilityScore: 35,
    releaseYear: 2003,
    reason: "A major modern Korean film, though less universally known than Parasite.",
  },
  moonlight: {
    tier: "canon",
    accessibilityScore: 25,
    releaseYear: 2016,
    reason: "A recent canon film with strong awards recognition.",
  },
  "one-flew-over-the-cuckoos-nest": {
    tier: "canon",
    accessibilityScore: 25,
    releaseYear: 1975,
    reason: "A widely known awards landmark with accessible performance focus.",
  },
  parasite: {
    tier: "mainstream",
    accessibilityScore: 5,
    releaseYear: 2019,
    reason: "A globally visible contemporary gateway film.",
  },
  rashomon: {
    tier: "canon",
    accessibilityScore: 30,
    releaseYear: 1950,
    reason: "A world-cinema landmark that still asks viewers to enter a historical mode.",
  },
  "seven-samurai": {
    tier: "canon",
    accessibilityScore: 25,
    releaseYear: 1954,
    reason: "A famous canon work with strong narrative accessibility despite its length.",
  },
  "spirited-away": {
    tier: "well-known-canon",
    accessibilityScore: 15,
    releaseYear: 2001,
    reason: "A highly accessible international animation landmark.",
  },
  "star-wars": {
    tier: "mainstream",
    accessibilityScore: 5,
    releaseYear: 1977,
    reason: "A globally familiar popular-cinema reference point.",
  },
  "taxi-driver": {
    tier: "canon",
    accessibilityScore: 25,
    releaseYear: 1976,
    reason: "A major New Hollywood text with darker psychological density.",
  },
  "the-godfather": {
    tier: "mainstream",
    accessibilityScore: 10,
    releaseYear: 1972,
    reason: "A broadly recognized canon film and common entry point.",
  },
  "tokyo-story": {
    tier: "canon",
    accessibilityScore: 45,
    releaseYear: 1953,
    reason: "A widely canonized film whose quiet form is more demanding for beginners.",
  },
  ugetsu: {
    tier: "specialist",
    accessibilityScore: 65,
    releaseYear: 1953,
    reason: "A specialist world-cinema classic that benefits from historical context.",
  },
  "woman-in-the-dunes": {
    tier: "specialist",
    accessibilityScore: 75,
    releaseYear: 1964,
    reason: "A more challenging modernist allegory with a less mainstream entry point.",
  },
};

export function getJourneyMovieAccessibility(
  movieId: string
): JourneyMovieAccessibility {
  const seeded = movieAccessibilityRegistry[movieId];

  if (!seeded) {
    return {
      movieId,
      tier: "unknown",
      accessibilityScore: UNKNOWN_ACCESSIBILITY_SCORE,
      reason:
        "No curated accessibility hint exists yet, so the verifier treats this as unknown.",
    };
  }

  return {
    movieId,
    ...seeded,
  };
}

export function scoreJourneyDifficulty(
  journey: Journey,
  stepOverride?: JourneyStep[]
): JourneyDifficultyScore {
  const steps =
    stepOverride ?? journeySteps.filter((step) => journey.stepIds.includes(step.id));
  const movieSteps = steps.filter((step) => step.entityType === "movie");
  const contextSteps = steps.filter((step) => step.entityType !== "movie");
  const movies = movieSteps.map((step) => getJourneyMovieAccessibility(step.entityId));
  const averageMovieAccessibility = average(
    movies.map((movie) => movie.accessibilityScore)
  );
  const releaseYears = movies
    .map((movie) => movie.releaseYear)
    .filter((year): year is number => typeof year === "number");
  const historicalRange =
    releaseYears.length > 1 ? Math.max(...releaseYears) - Math.min(...releaseYears) : 0;
  const contextTypes = new Set(contextSteps.map((step) => step.entityType));

  const components = [
    {
      name: "film-count",
      score: scoreFilmCount(movieSteps.length),
      maxScore: 22,
      note: `${movieSteps.length} films shape the viewing commitment.`,
    },
    {
      name: "movie-accessibility",
      score: scoreMovieAccessibility(averageMovieAccessibility),
      maxScore: 28,
      note: `Average accessibility score is ${Math.round(averageMovieAccessibility)}.`,
    },
    {
      name: "context-complexity",
      score: Math.min(16, Math.round(contextSteps.length * 1.5 + contextTypes.size * 2)),
      maxScore: 16,
      note: `${contextSteps.length} context stops across ${contextTypes.size} entity types.`,
    },
    {
      name: "time-commitment",
      score: scoreTimeCommitment(journey.estimatedHours),
      maxScore: 16,
      note: `${journey.estimatedHours} estimated viewing hours.`,
    },
    {
      name: "historical-range",
      score: scoreHistoricalRange(historicalRange),
      maxScore: 18,
      note: `${historicalRange} years between the earliest and latest film.`,
    },
  ];
  const score = components.reduce((total, component) => total + component.score, 0);
  const computedDifficulty = difficultyFromScore(score);

  return {
    journeyId: journey.id,
    declaredDifficulty: journey.difficulty,
    computedDifficulty,
    score,
    movieCount: movieSteps.length,
    averageMovieAccessibility,
    components,
    movies,
  };
}

export function computeJourneyDifficulty(journey: Journey): JourneyDifficulty {
  return scoreJourneyDifficulty(journey).computedDifficulty;
}

export function getJourneyDifficultyLabel(difficulty: JourneyDifficulty) {
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

export function isUnknownMovieAccessibility(tier: JourneyMovieAccessibilityTier) {
  return tier === "unknown";
}

function scoreFilmCount(movieCount: number) {
  if (movieCount <= 2) return 4;
  if (movieCount <= 4) return 10;
  if (movieCount <= 6) return 18;
  return 22;
}

function scoreMovieAccessibility(averageAccessibility: number) {
  if (averageAccessibility <= 12) return 4;
  if (averageAccessibility <= 25) return 10;
  if (averageAccessibility <= 40) return 18;
  if (averageAccessibility <= 55) return 24;
  return 28;
}

function scoreTimeCommitment(hours: number) {
  if (hours <= 5) return 3;
  if (hours <= 9) return 7;
  if (hours <= 13) return 12;
  return 16;
}

function scoreHistoricalRange(range: number) {
  if (range <= 10) return 0;
  if (range <= 25) return 5;
  if (range <= 50) return 10;
  return 18;
}

function difficultyFromScore(score: number): JourneyDifficulty {
  if (score < 45) return "beginner";
  if (score < 90) return "intermediate";
  return "advanced";
}

function average(values: number[]) {
  if (values.length === 0) return UNKNOWN_ACCESSIBILITY_SCORE;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

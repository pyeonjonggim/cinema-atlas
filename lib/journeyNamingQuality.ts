import type { Journey, JourneyDifficulty } from "@/types/journey";

type DifficultyPromise = {
  expectedMaxDifficulty: JourneyDifficulty;
  reason: string;
};

const BEGINNER_SIGNALS = [
  "introduction",
  "intro",
  "starter",
  "starting point",
  "doorway",
  "gateway",
  "beginner",
  "first steps",
];

const INTERMEDIATE_SIGNALS = ["foundations", "foundation", "essentials", "primer"];

export function validateJourneyNameDifficulty(
  journey: Pick<Journey, "id" | "title" | "subtitle" | "tags">,
  computedDifficulty: JourneyDifficulty
) {
  const promise = inferDifficultyPromise(journey);

  if (!promise) return [];

  if (isDifficultyAbove(computedDifficulty, promise.expectedMaxDifficulty)) {
    return [
      `Journey name promises ${promise.expectedMaxDifficulty} access but computes as ${computedDifficulty}: ${promise.reason}.`,
    ];
  }

  return [];
}

export function inferDifficultyPromise(
  journey: Pick<Journey, "title" | "subtitle" | "tags">
): DifficultyPromise | undefined {
  const searchable = [journey.title, journey.subtitle, ...journey.tags]
    .join(" ")
    .toLowerCase();

  if (BEGINNER_SIGNALS.some((signal) => searchable.includes(signal))) {
    return {
      expectedMaxDifficulty: "beginner",
      reason: "introductory language should stay genuinely accessible",
    };
  }

  if (INTERMEDIATE_SIGNALS.some((signal) => searchable.includes(signal))) {
    return {
      expectedMaxDifficulty: "intermediate",
      reason: "foundation language should not be advanced",
    };
  }

  return undefined;
}

function isDifficultyAbove(
  actual: JourneyDifficulty,
  expectedMax: JourneyDifficulty
) {
  return difficultyRank(actual) > difficultyRank(expectedMax);
}

function difficultyRank(difficulty: JourneyDifficulty) {
  if (difficulty === "beginner") return 1;
  if (difficulty === "intermediate") return 2;
  return 3;
}

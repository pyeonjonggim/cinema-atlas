export type JourneyDifficulty = "beginner" | "intermediate" | "advanced";

export type JourneyCategory =
  | "country"
  | "movement"
  | "director"
  | "award"
  | "theme"
  | "film-history";

export type JourneyAuthorType = "cinema-atlas" | "community";

export type JourneyVisibility = "private" | "public" | "unlisted";

export type JourneyStepEntityType =
  | "movie"
  | "director"
  | "actor"
  | "country"
  | "movement"
  | "award";

export type Journey = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage?: string;
  category: JourneyCategory;
  difficulty: JourneyDifficulty;
  estimatedMovies: number;
  estimatedHours: number;
  official: boolean;
  authorType: JourneyAuthorType;
  author: string;
  visibility: JourneyVisibility;
  tags: string[];
  stepIds: string[];
  likes?: number;
  followers?: number;
};

export type JourneyStep = {
  id: string;
  journeyId: string;
  order: number;
  entityType: JourneyStepEntityType;
  entityId: string;
  learningGoal: string;
  note?: string;
};

// Branch-ready note: the current UI renders steps as a linear timeline, but the
// domain keeps steps independent so future graph edges can be added without
// turning Journey into a progress, challenge, or collection model.
export type JourneyProgress = {
  journeyId: string;
  completedStepIds: string[];
  currentStepId?: string;
  startedAt?: string;
  completedAt?: string;
};

export type JourneyDifficulty = "beginner" | "intermediate" | "advanced";

export type JourneyMovieAccessibilityTier =
  | "mainstream"
  | "well-known-canon"
  | "canon"
  | "specialist"
  | "unknown";

export type JourneyMovieAccessibility = {
  movieId: string;
  tier: JourneyMovieAccessibilityTier;
  accessibilityScore: number;
  releaseYear?: number;
  reason: string;
};

export type JourneyDifficultyComponent = {
  name: string;
  score: number;
  maxScore: number;
  note: string;
};

export type JourneyDifficultyScore = {
  journeyId: string;
  declaredDifficulty: JourneyDifficulty;
  computedDifficulty: JourneyDifficulty;
  score: number;
  movieCount: number;
  averageMovieAccessibility: number;
  components: JourneyDifficultyComponent[];
  movies: JourneyMovieAccessibility[];
};

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

export type JourneyCatalogStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";

export type JourneyRecord = Journey & {
  catalogStatus: JourneyCatalogStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type JourneyRecordInput = Omit<
  JourneyRecord,
  "revision" | "createdAt" | "updatedAt"
> & {
  revision?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type JourneyListOptions = {
  catalogStatus?: JourneyCatalogStatus;
  visibility?: JourneyVisibility;
  official?: boolean;
};

export type JourneyRepositorySnapshot = {
  journeys: JourneyRecord[];
  steps: JourneyStep[];
  savedJourneys: SavedJourneyRecord[];
};

export type JourneyProjection = JourneyRecord & {
  steps: JourneyStep[];
};

export type JourneyRepository = {
  getJourneyById(id: string): Promise<JourneyRecord | undefined>;
  listJourneys(options?: JourneyListOptions): Promise<JourneyRecord[]>;
  listJourneySteps(journeyId: string): Promise<JourneyStep[]>;
  upsertJourney(record: JourneyRecordInput, steps: JourneyStep[]): Promise<JourneyRecord>;
  updateJourneyStatus(
    journeyId: string,
    catalogStatus: JourneyCatalogStatus
  ): Promise<JourneyRecord>;
  publishJourney(journeyId: string): Promise<JourneyRecord>;
  saveJourney(record: SavedJourneyRecord): Promise<SavedJourneyRecord>;
  listSavedJourneys(): Promise<SavedJourneyRecord[]>;
  snapshot(): JourneyRepositorySnapshot;
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

export type SavedJourneyStatus = "saved" | "in_progress" | "completed";

export type SavedJourneyRecord = {
  id: string;
  journeyId: string;
  status: SavedJourneyStatus;
  currentStepId?: string;
  savedAt: string;
  updatedAt: string;
};

export type JourneyDiscoveryPurpose =
  | "daily-feature"
  | "country-entry"
  | "movement-entry"
  | "award-entry"
  | "short-route"
  | "deep-route";

export type JourneyDiscoveryCriteria = {
  purpose?: JourneyDiscoveryPurpose;
  category?: JourneyCategory;
  difficulty?: JourneyDifficulty;
  minSteps?: number;
  maxSteps?: number;
  seed?: string;
  limit?: number;
};

export type JourneyBlueprintStatus = "draft" | "review" | "approved" | "archived";

export type JourneyBlueprintSource =
  | "editorial"
  | "catalog-derived"
  | "relationship-derived";

export type JourneyBlueprintAnchor = {
  entityType: JourneyStepEntityType;
  entityId: string;
  role: "entry" | "context" | "core" | "exit";
};

export type JourneyBlueprint = {
  id: string;
  title: string;
  category: JourneyCategory;
  status: JourneyBlueprintStatus;
  source: JourneyBlueprintSource;
  editorialIntent: string;
  minMovieStops: number;
  targetStepCount: number;
  anchors: JourneyBlueprintAnchor[];
  tags: string[];
};

export type JourneyCandidateStatus =
  | "draft"
  | "needs-editorial-review"
  | "ready-to-publish"
  | "rejected";

export type JourneyCandidate = {
  id: string;
  blueprintId: string;
  title: string;
  category: JourneyCategory;
  status: JourneyCandidateStatus;
  reason: string;
  steps: JourneyStep[];
  movieCount: number;
  stepCount: number;
  computedDifficulty: JourneyDifficulty;
  difficultyScore: number;
  validationIssues: string[];
};

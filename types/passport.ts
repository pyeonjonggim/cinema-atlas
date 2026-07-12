export type ChallengeCategory =
  | "country"
  | "director"
  | "movement"
  | "actor"
  | "award"
  | "genre"
  | "film-history"
  | "movie";

export type ChallengeDifficulty = "beginner" | "intermediate" | "advanced";

export type UserChallengeStatus =
  | "pinned"
  | "active"
  | "paused"
  | "archived";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  targetId?: string;
  targetLabel: string;
  targetCount: number;
  difficulty: ChallengeDifficulty;
  achievementId?: string;
};

export type UserChallenge = {
  challengeId: string;
  status?: UserChallengeStatus;
  active?: boolean;
  pinned?: boolean;
  pausedAt?: string;
  archivedAt?: string;
  startedAt?: string;
  completedAt?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  icon?: string;
  challengeId?: string;
};

export type UserAchievement = {
  achievementId: string;
  unlockedAt: string;
};

export type MilestoneCategory =
  | "movies"
  | "countries"
  | "directors"
  | "movements"
  | "awards"
  | "journals"
  | "journeys"
  | "challenges"
  | "rewatches";

export type Milestone = {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  targetCount: number;
  difficulty?: ChallengeDifficulty;
  unit: string;
  relatedEntityType?: ChallengeCategory;
  relatedEntityId?: string;
  order: number;
};

export type UserMilestone = {
  milestoneId: string;
  current: number;
  completed: boolean;
  completedAt?: string;
};

export type PassportHistoryEventType =
  | "challenge_started"
  | "challenge_paused"
  | "challenge_resumed"
  | "challenge_archived"
  | "challenge_completed"
  | "achievement_unlocked"
  | "milestone_completed"
  | "journey_started"
  | "journey_completed"
  | "movie_contributed";

export type PassportHistoryEvent = {
  id: string;
  type: PassportHistoryEventType;
  date: string;
  title: string;
  description: string;
  entityType?: ChallengeCategory;
  entityId?: string;
  challengeId?: string;
  achievementId?: string;
  journeyId?: string;
  movieId?: string;
  href?: string;
};

export type ExplorerProgressStatus =
  | "unexplored"
  | "started"
  | "exploring"
  | "established";

export type ExplorerCountryProgress = {
  countryId: string;
  countryName: string;
  flag?: string;
  regionId: string;
  watchedCount: number;
  totalKnownMovies: number;
  progressPercent: number;
  status: ExplorerProgressStatus;
  directorCount: number;
  decadeCount: number;
  lastWatchedAt?: string;
  representativeMovieIds: string[];
  unexploredMovieIds: string[];
};

export type ExplorerRegionProgress = {
  regionId: string;
  countryIds: string[];
  exploredCountryCount: number;
  totalCountryCount: number;
  watchedMovieCount: number;
  progressPercent: number;
  status: ExplorerProgressStatus;
};

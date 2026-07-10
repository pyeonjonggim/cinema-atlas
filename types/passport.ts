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

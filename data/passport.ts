import type {
  Achievement,
  Challenge,
  UserAchievement,
  UserChallenge,
} from "@/types/passport";

export const challenges: Challenge[] = [
  {
    id: "japanese-cinema-starter",
    title: "Japanese Cinema Starter",
    description: "Begin exploring Japanese cinema through recorded films.",
    category: "country",
    targetId: "japan",
    targetLabel: "Japan",
    targetCount: 3,
    difficulty: "beginner",
    achievementId: "japanese-cinema-explorer",
  },
  {
    id: "korean-cinema-starter",
    title: "Korean Cinema Starter",
    description: "Trace contemporary Korean cinema through your watched record.",
    category: "country",
    targetId: "korea",
    targetLabel: "Korea",
    targetCount: 3,
    difficulty: "beginner",
    achievementId: "korean-cinema-explorer",
  },
  {
    id: "kurosawa-apprentice",
    title: "Kurosawa Apprentice",
    description: "Watch films directed by Akira Kurosawa.",
    category: "director",
    targetId: "akira-kurosawa",
    targetLabel: "Akira Kurosawa",
    targetCount: 2,
    difficulty: "beginner",
    achievementId: "kurosawa-apprentice",
  },
  {
    id: "academy-best-picture-path",
    title: "Academy Best Picture Path",
    description: "Explore films connected to the Academy Award for Best Picture.",
    category: "award",
    targetId: "academy-best-picture",
    targetLabel: "Academy Best Picture",
    targetCount: 3,
    difficulty: "intermediate",
    achievementId: "best-picture-traveler",
  },
  {
    id: "new-hollywood-entry",
    title: "New Hollywood Entry",
    description: "Start exploring the New Hollywood movement.",
    category: "movement",
    targetId: "new-hollywood",
    targetLabel: "New Hollywood",
    targetCount: 2,
    difficulty: "beginner",
    achievementId: "new-hollywood-observer",
  },
  {
    id: "crime-drama-thread",
    title: "Crime Drama Thread",
    description: "Follow crime and drama as a recurring viewing pattern.",
    category: "genre",
    targetId: "crime",
    targetLabel: "Crime",
    targetCount: 3,
    difficulty: "intermediate",
  },
];

export const userChallenges: UserChallenge[] = [
  {
    challengeId: "japanese-cinema-starter",
    active: true,
    startedAt: "2024-01-03",
  },
  {
    challengeId: "korean-cinema-starter",
    active: true,
    startedAt: "2024-01-01",
  },
  {
    challengeId: "academy-best-picture-path",
    active: true,
    startedAt: "2024-01-01",
  },
  {
    challengeId: "kurosawa-apprentice",
    active: false,
    startedAt: "2024-01-03",
  },
];

export const achievements: Achievement[] = [
  {
    id: "first-passport-stamp",
    title: "First Passport Stamp",
    description: "Record your first completed film journey.",
    category: "movie",
  },
  {
    id: "japanese-cinema-explorer",
    title: "Japanese Cinema Explorer",
    description: "Begin a journey through Japanese cinema.",
    category: "country",
    challengeId: "japanese-cinema-starter",
  },
  {
    id: "korean-cinema-explorer",
    title: "Korean Cinema Explorer",
    description: "Begin a journey through contemporary Korean cinema.",
    category: "country",
    challengeId: "korean-cinema-starter",
  },
  {
    id: "kurosawa-apprentice",
    title: "Kurosawa Apprentice",
    description: "Start learning cinema through Akira Kurosawa.",
    category: "director",
    challengeId: "kurosawa-apprentice",
  },
  {
    id: "best-picture-traveler",
    title: "Best Picture Traveler",
    description: "Explore films recognized by the Academy.",
    category: "award",
    challengeId: "academy-best-picture-path",
  },
  {
    id: "new-hollywood-observer",
    title: "New Hollywood Observer",
    description: "Open the door to New Hollywood.",
    category: "movement",
    challengeId: "new-hollywood-entry",
  },
];

export const userAchievements: UserAchievement[] = [
  {
    achievementId: "first-passport-stamp",
    unlockedAt: "2024-01-01",
  },
];

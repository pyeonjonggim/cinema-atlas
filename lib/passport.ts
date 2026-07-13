import type { Movie } from "@/types/movie";
import { journeySteps } from "@/data/journeys";
import type { Country } from "@/data/countries";
import type { Journey, JourneyStep } from "@/types/journey";
import type { JournalEntry } from "@/types/journal";
import type {
  Achievement,
  Challenge,
  ChallengeCategory,
  ExplorerCountryProgress,
  ExplorerProgressStatus,
  ExplorerRegionProgress,
  Milestone,
  MilestoneCategory,
  PassportHistoryEvent,
  UserAchievement,
  UserChallenge,
} from "@/types/passport";
import type { UserMovie } from "@/types/userMovie";

export type ChallengeProgress = {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
  status: "pinned" | "active" | "paused" | "archived" | "completed";
  completedEvidence: Movie[];
  remainingEvidence: Movie[];
  suggestedNext: PassportSuggestion[];
};

export type AchievementProgress = {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  linkedChallenge?: ChallengeProgress;
  evidenceMovies: Movie[];
  relatedMovies: Movie[];
  missingRequirements: string[];
};

export type EntityProgress = {
  category: ChallengeCategory;
  label: string;
  current: number;
  target: number;
  percentage: number;
  rank: string;
  traces: string[];
};

export type JourneyProgressPreview = {
  journey: Journey;
  completedSteps: number;
  totalSteps: number;
  status: "not-started" | "in-progress" | "completed";
  href: string;
};

export type PassportSuggestion = {
  label: string;
  title: string;
  description: string;
  href: string;
};

export type PassportModel = {
  activeChallenges: ChallengeProgress[];
  challengeLibrary: ChallengeProgress[];
  latestAchievements: AchievementProgress[];
  achievementGallery: AchievementProgress[];
  explorationProgress: EntityProgress[];
  journeyProgress: JourneyProgressPreview[];
  milestoneProgress: MilestoneProgress[];
  passportHistory: PassportHistoryEvent[];
  explorerCountries: ExplorerCountryProgress[];
  explorerRegions: ExplorerRegionProgress[];
};

export type MilestoneProgress = {
  milestone: Milestone;
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
  completedAt?: string;
  unavailable?: boolean;
};

type BuildPassportModelInput = {
  movies: Movie[];
  userMovies: UserMovie[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  milestones?: Milestone[];
  journalEntries?: JournalEntry[];
  journeys?: Journey[];
  countries?: Country[];
};

export function buildPassportModel({
  movies,
  userMovies,
  challenges,
  userChallenges,
  achievements,
  userAchievements,
  milestones = [],
  journalEntries = [],
  journeys = [],
  countries = [],
}: BuildPassportModelInput): PassportModel {
  const watchedMovies = getWatchedMovies({ movies, userMovies });
  const userChallengeById = new Map(
    userChallenges.map((userChallenge) => [
      userChallenge.challengeId,
      userChallenge,
    ])
  );
  const challengeProgress = challenges.map((challenge) =>
    buildChallengeProgress({
        challenge,
        userChallenge: userChallengeById.get(challenge.id),
        movies,
        watchedMovies,
      })
  );
  const challengeProgressById = new Map(
    challengeProgress.map((progress) => [progress.challenge.id, progress])
  );
  const userAchievementById = new Map(
    userAchievements.map((userAchievement) => [
      userAchievement.achievementId,
      userAchievement,
    ])
  );
  const achievementProgress = achievements.map((achievement) => {
    const userAchievement = userAchievementById.get(achievement.id);
    const linkedChallenge = achievement.challengeId
      ? challengeProgressById.get(achievement.challengeId)
      : undefined;
    const unlocked = Boolean(userAchievement) || Boolean(linkedChallenge?.completed);
    const evidenceMovies = linkedChallenge?.completedEvidence ?? watchedMovies.slice(0, 1);
    const relatedMovies = [
      ...evidenceMovies,
      ...(linkedChallenge?.remainingEvidence ?? []),
    ].slice(0, 4);

    return {
      achievement,
      unlocked,
      linkedChallenge,
      evidenceMovies,
      relatedMovies,
      missingRequirements: buildAchievementRequirements({
        unlocked,
        linkedChallenge,
        achievement,
      }),
      unlockedAt:
        userAchievement?.unlockedAt ??
        (linkedChallenge?.completed ? linkedChallenge.userChallenge?.completedAt : undefined),
    };
  });
  const journeyProgress = buildJourneyProgress({
    journeys,
    watchedMovies,
  });
  const milestoneProgress = buildMilestoneProgress({
    milestones,
    watchedMovies,
    journalEntries,
    challengeProgress,
    journeyProgress,
  });
  const explorerCountries = buildExplorerCountryProgress({
    countries,
    movies,
    userMovies,
  });
  const explorerRegions = buildExplorerRegionProgress(explorerCountries);

  return {
    activeChallenges: challengeProgress
      .filter((progress) => progress.userChallenge?.active)
      .slice(0, 5),
    challengeLibrary: challengeProgress,
    latestAchievements: achievementProgress
      .filter((progress) => progress.unlocked)
      .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
      .slice(0, 3),
    achievementGallery: achievementProgress,
    explorationProgress: buildExplorationProgress(watchedMovies),
    journeyProgress,
    milestoneProgress,
    passportHistory: buildPassportHistory({
      userChallenges,
      challengeProgress,
      achievementProgress,
      milestoneProgress,
    }),
    explorerCountries,
    explorerRegions,
  };
}

function getWatchedMovies({
  movies,
  userMovies,
}: {
  movies: Movie[];
  userMovies: UserMovie[];
}) {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));

  return userMovies
    .filter((userMovie) => userMovie.watchStatus === "completed")
    .map((userMovie) => movieById.get(userMovie.movieId))
    .filter((movie): movie is Movie => Boolean(movie));
}

function buildChallengeProgress({
  challenge,
  userChallenge,
  movies,
  watchedMovies,
}: {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  movies: Movie[];
  watchedMovies: Movie[];
}): ChallengeProgress {
  const completedEvidence = watchedMovies.filter((movie) =>
    movieMatchesChallenge(movie, challenge)
  );
  const remainingEvidence = movies
    .filter((movie) => !watchedMovies.some((watchedMovie) => watchedMovie.id === movie.id))
    .filter((movie) => movieMatchesChallenge(movie, challenge))
    .slice(0, Math.max(3, challenge.targetCount));
  const current = completedEvidence.length;
  const target = challenge.targetCount;
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const completed = current >= target;

  return {
    challenge,
    userChallenge,
    current,
    target,
    percentage,
    completed,
    status: completed ? "completed" : getChallengeStatus(userChallenge),
    completedEvidence,
    remainingEvidence,
    suggestedNext: buildChallengeSuggestions({
      challenge,
      remainingEvidence,
    }),
  };
}

function movieMatchesChallenge(movie: Movie, challenge: Challenge) {
  if (!challenge.targetId) return false;

  switch (challenge.category) {
    case "country":
      return (
        movie.countryIds?.includes(challenge.targetId) ||
        movie.countrySlug === challenge.targetId
      );
    case "director":
      return (
        movie.directorIds?.includes(challenge.targetId) ||
        movie.directorSlug === challenge.targetId
      );
    case "movement":
      return (
        movie.movementIds?.includes(challenge.targetId) ||
        movie.movementSlug === challenge.targetId
      );
    case "actor":
      return (
        movie.actorIds?.includes(challenge.targetId) ||
        movie.actorSlugs?.includes(challenge.targetId)
      );
    case "award":
      return (
        movie.awardIds?.includes(challenge.targetId) ||
        movie.awardSlugs?.includes(challenge.targetId)
      );
    case "genre":
      return (movie.genres ?? [movie.genre]).some(
        (genre) => slugify(genre) === challenge.targetId
      );
    case "movie":
      return movie.id === challenge.targetId;
    case "film-history":
      return String(movie.year).startsWith(challenge.targetId);
    default:
      return false;
  }
}

function buildExplorationProgress(watchedMovies: Movie[]): EntityProgress[] {
  return [
    buildEntityProgress({
      category: "country",
      label: "Countries",
      values: watchedMovies.map((movie) => movie.country),
      target: 10,
    }),
    buildEntityProgress({
      category: "director",
      label: "Directors",
      values: watchedMovies.map((movie) => movie.director),
      target: 20,
    }),
    buildEntityProgress({
      category: "movement",
      label: "Movements",
      values: watchedMovies.map((movie) => movie.movement),
      target: 12,
    }),
    buildEntityProgress({
      category: "actor",
      label: "Actors",
      values: watchedMovies.flatMap((movie) => movie.actors),
      target: 50,
    }),
    buildEntityProgress({
      category: "award",
      label: "Awards",
      values: watchedMovies.flatMap((movie) => movie.awards),
      target: 15,
    }),
    {
      category: "movie",
      label: "Movies",
      current: watchedMovies.length,
      target: 100,
      percentage: Math.min(100, Math.round((watchedMovies.length / 100) * 100)),
      rank: getRank(watchedMovies.length, 100),
      traces: watchedMovies.slice(0, 5).map((movie) => movie.title),
    },
  ];
}

function buildJourneyProgress({
  journeys,
  watchedMovies,
}: {
  journeys: Journey[];
  watchedMovies: Movie[];
}): JourneyProgressPreview[] {
  const watchedMovieIds = new Set(watchedMovies.map((movie) => movie.id));

  return journeys.map((journey) => {
    const movieStepIds = journey.stepIds
      .map((stepId) => journeySteps.find((step) => step.id === stepId))
      .filter(
        (step): step is JourneyStep =>
          step !== undefined && step.entityType === "movie"
      )
      .map((step) => step.entityId)
      .filter((movieId): movieId is string => Boolean(movieId));
    const totalSteps = movieStepIds.length;
    const completedSteps = movieStepIds.filter((movieId) =>
      watchedMovieIds.has(movieId)
    ).length;

    return {
      journey,
      completedSteps,
      totalSteps,
      status: getJourneyStatus(completedSteps, totalSteps),
      href: `/explore/journeys/${journey.id}`,
    };
  });
}

function buildMilestoneProgress({
  milestones,
  watchedMovies,
  journalEntries,
  challengeProgress,
  journeyProgress,
}: {
  milestones: Milestone[];
  watchedMovies: Movie[];
  journalEntries: JournalEntry[];
  challengeProgress: ChallengeProgress[];
  journeyProgress: JourneyProgressPreview[];
}): MilestoneProgress[] {
  return milestones
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((milestone) => {
      const current = getMilestoneCurrent({
        category: milestone.category,
        watchedMovies,
        journalEntries,
        challengeProgress,
        journeyProgress,
      });
      const unavailable = milestone.category === "journeys";
      const completed = !unavailable && current >= milestone.targetCount;

      return {
        milestone,
        current,
        target: milestone.targetCount,
        percentage:
          milestone.targetCount > 0
            ? Math.min(100, Math.round((current / milestone.targetCount) * 100))
            : 0,
        completed,
        completedAt: completed ? getMilestoneCompletedAt(milestone, watchedMovies) : undefined,
        unavailable,
      };
    });
}

function getMilestoneCurrent({
  category,
  watchedMovies,
  journalEntries,
  challengeProgress,
  journeyProgress,
}: {
  category: MilestoneCategory;
  watchedMovies: Movie[];
  journalEntries: JournalEntry[];
  challengeProgress: ChallengeProgress[];
  journeyProgress: JourneyProgressPreview[];
}) {
  if (category === "movies") return watchedMovies.length;
  if (category === "countries") {
    return new Set(watchedMovies.flatMap((movie) => movie.countryIds ?? [movie.countrySlug])).size;
  }
  if (category === "directors") {
    return new Set(watchedMovies.flatMap((movie) => movie.directorIds ?? [movie.directorSlug])).size;
  }
  if (category === "movements") {
    return new Set(watchedMovies.flatMap((movie) => movie.movementIds ?? [movie.movementSlug])).size;
  }
  if (category === "awards") {
    return new Set(watchedMovies.flatMap((movie) => movie.awardIds ?? movie.awardSlugs)).size;
  }
  if (category === "journals") return journalEntries.length;
  if (category === "challenges") {
    return challengeProgress.filter((progress) => progress.completed).length;
  }
  if (category === "journeys") {
    return journeyProgress.filter((progress) => progress.status === "completed").length;
  }
  if (category === "rewatches") {
    return 0;
  }

  return 0;
}

function getMilestoneCompletedAt(milestone: Milestone, watchedMovies: Movie[]) {
  if (milestone.category === "movies") {
    return watchedMovies[milestone.targetCount - 1]?.watchedDate;
  }

  return watchedMovies[watchedMovies.length - 1]?.watchedDate;
}

function buildPassportHistory({
  userChallenges,
  challengeProgress,
  achievementProgress,
  milestoneProgress,
}: {
  userChallenges: UserChallenge[];
  challengeProgress: ChallengeProgress[];
  achievementProgress: AchievementProgress[];
  milestoneProgress: MilestoneProgress[];
}): PassportHistoryEvent[] {
  const challengeById = new Map(
    challengeProgress.map((progress) => [progress.challenge.id, progress])
  );
  const events: PassportHistoryEvent[] = [];

  userChallenges.forEach((userChallenge) => {
    const progress = challengeById.get(userChallenge.challengeId);
    if (!progress) return;

    if (userChallenge.startedAt) {
      events.push({
        id: `challenge-started-${userChallenge.challengeId}`,
        type: "challenge_started",
        date: userChallenge.startedAt,
        title: `Started ${progress.challenge.title}`,
        description: "A Passport goal became active.",
        challengeId: progress.challenge.id,
        href: `/passport/challenges/${progress.challenge.id}`,
      });
    }

    if (userChallenge.pausedAt) {
      events.push({
        id: `challenge-paused-${userChallenge.challengeId}`,
        type: "challenge_paused",
        date: userChallenge.pausedAt,
        title: `Paused ${progress.challenge.title}`,
        description: "This goal is waiting for a later return.",
        challengeId: progress.challenge.id,
        href: `/passport/challenges/${progress.challenge.id}`,
      });
    }

    if (userChallenge.completedAt || progress.completed) {
      events.push({
        id: `challenge-completed-${userChallenge.challengeId}`,
        type: "challenge_completed",
        date: userChallenge.completedAt ?? "2024-01-03",
        title: `Completed ${progress.challenge.title}`,
        description: "A Passport challenge crossed its target.",
        challengeId: progress.challenge.id,
        href: `/passport/challenges/${progress.challenge.id}`,
      });
    }
  });

  achievementProgress
    .filter((achievement) => achievement.unlocked && achievement.unlockedAt)
    .forEach((achievement) => {
      events.push({
        id: `achievement-unlocked-${achievement.achievement.id}`,
        type: "achievement_unlocked",
        date: achievement.unlockedAt as string,
        title: `Recorded ${achievement.achievement.title}`,
        description: achievement.achievement.description,
        achievementId: achievement.achievement.id,
        href: `/passport/achievements/${achievement.achievement.id}`,
      });
    });

  milestoneProgress
    .filter((milestone) => milestone.completed && milestone.completedAt)
    .forEach((milestone) => {
      events.push({
        id: `milestone-completed-${milestone.milestone.id}`,
        type: "milestone_completed",
        date: milestone.completedAt as string,
        title: `Completed ${milestone.milestone.title}`,
        description: milestone.milestone.description,
        href: "/passport/milestones",
      });
    });

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

function buildExplorerCountryProgress({
  countries,
  movies,
  userMovies,
}: {
  countries: Country[];
  movies: Movie[];
  userMovies: UserMovie[];
}): ExplorerCountryProgress[] {
  const completedByMovieId = new Map(
    userMovies
      .filter((userMovie) => userMovie.watchStatus === "completed")
      .map((userMovie) => [userMovie.movieId, userMovie])
  );

  return countries
    .map((country) => {
      const knownMovies = movies.filter((movie) =>
        (movie.countryIds ?? [movie.countrySlug]).includes(country.slug)
      );
      const watchedMovies = knownMovies.filter((movie) =>
        completedByMovieId.has(movie.id)
      );
      const directorIds = new Set(
        watchedMovies.flatMap((movie) => movie.directorIds ?? [movie.directorSlug])
      );
      const decades = new Set(
        watchedMovies.map((movie) => `${Math.floor(movie.year / 10) * 10}s`)
      );
      const lastWatchedAt = watchedMovies
        .map((movie) => completedByMovieId.get(movie.id)?.watchedDate)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1);
      const progressPercent =
        knownMovies.length > 0
          ? Math.round((watchedMovies.length / knownMovies.length) * 100)
          : 0;

      return {
        countryId: country.slug,
        countryName: country.name,
        flag: country.flag,
        regionId: normalizeRegion(country.region),
        watchedCount: watchedMovies.length,
        totalKnownMovies: knownMovies.length,
        progressPercent,
        status: getExplorerStatus({
          watchedCount: watchedMovies.length,
          directorCount: directorIds.size,
          decadeCount: decades.size,
          progressPercent,
        }),
        directorCount: directorIds.size,
        decadeCount: decades.size,
        lastWatchedAt,
        representativeMovieIds: watchedMovies.slice(0, 4).map((movie) => movie.id),
        unexploredMovieIds: knownMovies
          .filter((movie) => !completedByMovieId.has(movie.id))
          .map((movie) => movie.id),
      };
    })
    .sort((a, b) => {
      if (b.watchedCount !== a.watchedCount) return b.watchedCount - a.watchedCount;
      return a.countryName.localeCompare(b.countryName);
    });
}

function buildExplorerRegionProgress(
  countries: ExplorerCountryProgress[]
): ExplorerRegionProgress[] {
  const regionIds = Array.from(new Set(countries.map((country) => country.regionId)));

  return regionIds
    .map((regionId) => {
      const regionCountries = countries.filter((country) => country.regionId === regionId);
      const exploredCountryCount = regionCountries.filter(
        (country) => country.watchedCount > 0
      ).length;
      const watchedMovieCount = regionCountries.reduce(
        (sum, country) => sum + country.watchedCount,
        0
      );
      const totalKnownMovies = regionCountries.reduce(
        (sum, country) => sum + country.totalKnownMovies,
        0
      );
      const progressPercent =
        totalKnownMovies > 0 ? Math.round((watchedMovieCount / totalKnownMovies) * 100) : 0;

      return {
        regionId,
        countryIds: regionCountries.map((country) => country.countryId),
        exploredCountryCount,
        totalCountryCount: regionCountries.length,
        watchedMovieCount,
        progressPercent,
        status: getExplorerStatus({
          watchedCount: watchedMovieCount,
          directorCount: exploredCountryCount,
          decadeCount: 0,
          progressPercent,
        }),
      };
    })
    .sort((a, b) => {
      if (b.watchedMovieCount !== a.watchedMovieCount) {
        return b.watchedMovieCount - a.watchedMovieCount;
      }
      return a.regionId.localeCompare(b.regionId);
    });
}

function getExplorerStatus({
  watchedCount,
  directorCount,
  decadeCount,
  progressPercent,
}: {
  watchedCount: number;
  directorCount: number;
  decadeCount: number;
  progressPercent: number;
}): ExplorerProgressStatus {
  if (watchedCount === 0) return "unexplored";
  if (progressPercent >= 70 && watchedCount >= 5) return "established";
  if (watchedCount >= 3 || directorCount >= 2 || decadeCount >= 2) return "exploring";
  return "started";
}

function normalizeRegion(region: string) {
  const normalized = region.toLowerCase();

  if (normalized.includes("asia")) return "Asia";
  if (normalized.includes("europe")) return "Europe";
  if (normalized.includes("north america")) return "North America";
  if (normalized.includes("latin") || normalized.includes("south america")) {
    return "Latin America";
  }
  if (normalized.includes("middle east")) return "Middle East";
  if (normalized.includes("africa")) return "Africa";
  if (normalized.includes("oceania")) return "Oceania";

  return region || "Other";
}

function buildChallengeSuggestions({
  challenge,
  remainingEvidence,
}: {
  challenge: Challenge;
  remainingEvidence: Movie[];
}): PassportSuggestion[] {
  const nextMovie = remainingEvidence[0];

  if (nextMovie) {
    return [
      {
        label: "Movie",
        title: nextMovie.title,
        description: `A direct next step for ${challenge.targetLabel}.`,
        href: `/movies/${nextMovie.id}`,
      },
      buildEntitySuggestion(challenge),
    ];
  }

  return [
    buildEntitySuggestion(challenge),
    {
      label: "Explore",
      title: "Browse Guided Journeys",
      description: "Find a curated route that can deepen this Passport goal.",
      href: "/explore/journeys",
    },
    {
      label: "Movies",
      title: "Browse Movies",
      description: "Open another film and continue expanding this challenge.",
      href: "/encyclopedia/movies",
    },
  ];
}

function buildAchievementRequirements({
  unlocked,
  linkedChallenge,
  achievement,
}: {
  unlocked: boolean;
  linkedChallenge?: ChallengeProgress;
  achievement: Achievement;
}) {
  if (unlocked) return [];

  if (linkedChallenge) {
    const remaining = Math.max(linkedChallenge.target - linkedChallenge.current, 0);

    return [
      `Record ${remaining} more ${linkedChallenge.challenge.targetLabel} film${
        remaining === 1 ? "" : "s"
      }.`,
      `Complete ${linkedChallenge.challenge.title}.`,
    ];
  }

  return [`Continue exploring ${getCategoryLabel(achievement.category).toLowerCase()} entries.`];
}

function buildEntitySuggestion(challenge: Challenge): PassportSuggestion {
  return {
    label: getCategoryLabel(challenge.category),
    title: challenge.targetLabel,
    description: "Use the Encyclopedia context to choose the next meaningful stop.",
    href: getChallengeHref(challenge),
  };
}

function getChallengeStatus(userChallenge?: UserChallenge) {
  if (userChallenge?.status) return userChallenge.status;
  if (userChallenge?.active) return "active";
  return "active";
}

function getChallengeHref(challenge: Challenge) {
  if (!challenge.targetId) return "/explore";

  if (challenge.category === "country") {
    return `/encyclopedia/countries/${challenge.targetId}`;
  }

  if (challenge.category === "director") {
    return `/encyclopedia/directors/${challenge.targetId}`;
  }

  if (challenge.category === "movement") {
    return `/encyclopedia/movements/${challenge.targetId}`;
  }

  if (challenge.category === "award") {
    return `/encyclopedia/awards/${challenge.targetId}`;
  }

  if (challenge.category === "actor") {
    return `/encyclopedia/actors/${challenge.targetId}`;
  }

  return "/encyclopedia/movies";
}

function getCategoryLabel(category: ChallengeCategory) {
  const labels: Record<ChallengeCategory, string> = {
    country: "Country",
    director: "Director",
    movement: "Movement",
    actor: "Actor",
    award: "Award",
    genre: "Genre",
    "film-history": "Film History",
    movie: "Movie",
  };

  return labels[category];
}

function getJourneyStatus(completedSteps: number, totalSteps: number) {
  if (totalSteps === 0 || completedSteps === 0) return "not-started";
  if (completedSteps >= totalSteps) return "completed";
  return "in-progress";
}

function buildEntityProgress({
  category,
  label,
  values,
  target,
}: {
  category: ChallengeCategory;
  label: string;
  values: string[];
  target: number;
}): EntityProgress {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));
  const current = uniqueValues.length;
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return {
    category,
    label,
    current,
    target,
    percentage,
    rank: getRank(current, target),
    traces: uniqueValues.slice(0, 5),
  };
}

function getRank(current: number, target: number) {
  const percentage = target > 0 ? current / target : 0;

  if (percentage >= 1) return "Legend";
  if (percentage >= 0.75) return "Master";
  if (percentage >= 0.5) return "Scholar";
  if (percentage >= 0.25) return "Traveler";

  return "Explorer";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

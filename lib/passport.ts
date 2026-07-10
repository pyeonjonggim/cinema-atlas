import type { Movie } from "@/types/movie";
import { journeySteps } from "@/data/journeys";
import type { Journey, JourneyStep } from "@/types/journey";
import type {
  Achievement,
  Challenge,
  ChallengeCategory,
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
};

type BuildPassportModelInput = {
  movies: Movie[];
  userMovies: UserMovie[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  journeys?: Journey[];
};

export function buildPassportModel({
  movies,
  userMovies,
  challenges,
  userChallenges,
  achievements,
  userAchievements,
  journeys = [],
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

    return {
      achievement,
      unlocked,
      unlockedAt:
        userAchievement?.unlockedAt ??
        (linkedChallenge?.completed ? linkedChallenge.userChallenge?.completedAt : undefined),
    };
  });

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
    journeyProgress: buildJourneyProgress({
      journeys,
      watchedMovies,
    }),
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

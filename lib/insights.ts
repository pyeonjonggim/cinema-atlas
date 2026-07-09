import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

export type InsightCount = {
  label: string;
  value: number;
  percentage?: number;
};

export type InsightMovieRating = {
  movie: Movie;
  rating: number;
};

export type MyInsights = {
  moviesWatched: number;
  totalRuntime: number;
  rewatchCount: number;
  journalCount: number;
  averageRating?: number;
  ratingDistribution: InsightCount[];
  highestRatedMovies: InsightMovieRating[];
  lowestRatedMovies: InsightMovieRating[];
  countryDistribution: InsightCount[];
  directorDistribution: InsightCount[];
  genreDistribution: InsightCount[];
  watchedYearDistribution: InsightCount[];
  watchedMonthDistribution: InsightCount[];
  decadeDistribution: InsightCount[];
  firstDirector?: string;
  latestDirector?: string;
  storyInsights: string[];
};

type BuildMyInsightsInput = {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export function buildMyInsights({
  movies,
  userMovies,
  journalEntries,
}: BuildMyInsightsInput): MyInsights {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const watchedRecords = userMovies
    .filter((userMovie) => userMovie.watchStatus === "completed")
    .map((userMovie) => ({
      userMovie,
      movie: movieById.get(userMovie.movieId),
    }))
    .filter(
      (record): record is { userMovie: UserMovie; movie: Movie } =>
        Boolean(record.movie)
    );
  const watchedMovies = watchedRecords.map((record) => record.movie);
  const moviesWatched = watchedRecords.length;
  const ratingValues = watchedRecords
    .map((record) => record.userMovie.myRating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);
  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
      : undefined;
  const ratedMovies = watchedRecords
    .filter(
      (record): record is { userMovie: UserMovie & { myRating: number }; movie: Movie } =>
        typeof record.userMovie.myRating === "number"
    )
    .map((record) => ({
      movie: record.movie,
      rating: record.userMovie.myRating,
    }))
    .sort((a, b) => b.rating - a.rating);

  const sortedByWatchDate = [...watchedRecords].sort((a, b) =>
    (a.userMovie.watchedDate ?? "").localeCompare(b.userMovie.watchedDate ?? "")
  );

  const insights: MyInsights = {
    moviesWatched,
    totalRuntime: watchedMovies.reduce((sum, movie) => sum + movie.runtime, 0),
    rewatchCount: watchedRecords.reduce(
      (sum, record) => sum + (record.userMovie.rewatchCount ?? 0),
      0
    ),
    journalCount: journalEntries.length,
    averageRating,
    ratingDistribution: buildRatingDistribution(ratingValues),
    highestRatedMovies: ratedMovies.slice(0, 3),
    lowestRatedMovies: [...ratedMovies].reverse().slice(0, 3),
    countryDistribution: buildDistribution(
      watchedMovies.map((movie) => movie.country),
      moviesWatched
    ),
    directorDistribution: buildDistribution(
      watchedMovies.map((movie) => movie.director),
      moviesWatched
    ),
    genreDistribution: buildDistribution(
      watchedMovies.flatMap((movie) => movie.genres ?? [movie.genre]),
      moviesWatched
    ),
    watchedYearDistribution: buildDistribution(
      watchedRecords
        .map((record) => record.userMovie.watchedDate?.slice(0, 4))
        .filter((year): year is string => Boolean(year)),
      moviesWatched
    ),
    watchedMonthDistribution: buildDistribution(
      watchedRecords
        .map((record) => record.userMovie.watchedDate?.slice(0, 7))
        .filter((month): month is string => Boolean(month)),
      moviesWatched
    ),
    decadeDistribution: buildDistribution(
      watchedMovies.map((movie) => `${Math.floor(movie.year / 10) * 10}s`),
      moviesWatched
    ),
    firstDirector: sortedByWatchDate[0]?.movie.director,
    latestDirector: sortedByWatchDate.at(-1)?.movie.director,
    storyInsights: [],
  };

  return {
    ...insights,
    storyInsights: buildStoryInsights(insights),
  };
}

function buildDistribution(values: string[], total: number): InsightCount[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function buildRatingDistribution(ratings: number[]): InsightCount[] {
  const buckets = ["5", "4", "3", "2", "1"];

  return buckets.map((label) => {
    const value = ratings.filter((rating) => Math.floor(rating) === Number(label)).length;

    return {
      label,
      value,
      percentage: ratings.length > 0 ? Math.round((value / ratings.length) * 100) : 0,
    };
  });
}

function buildStoryInsights(insights: MyInsights) {
  const storyInsights: string[] = [];
  const topCountry = insights.countryDistribution[0];
  const topGenre = insights.genreDistribution[0];
  const topDecade = insights.decadeDistribution[0];

  if (topCountry) {
    storyInsights.push(
      `${topCountry.label} films make up ${topCountry.percentage}% of your watched record.`
    );
  }

  if (topGenre) {
    storyInsights.push(
      `${topGenre.label} appears most often in your recent viewing pattern.`
    );
  }

  if (topDecade) {
    storyInsights.push(
      `Your timeline leans toward films from the ${topDecade.label}.`
    );
  }

  if (insights.journalCount > 0 && insights.moviesWatched > 0) {
    storyInsights.push(
      `You have written journals for ${Math.round(
        (insights.journalCount / insights.moviesWatched) * 100
      )}% of your watched films.`
    );
  }

  return storyInsights;
}

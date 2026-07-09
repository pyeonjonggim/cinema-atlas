import type { Collection } from "@/types/collection";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

export type CollectionView = {
  collection: Collection;
  movies: Movie[];
  stats: CollectionStats;
};

export type CollectionStats = {
  movieCount: number;
  countryCount: number;
  directorCount: number;
  averageRating?: number;
  journalCount: number;
};

type BuildCollectionsInput = {
  collections: Collection[];
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export function buildCollectionViews({
  collections,
  movies,
  userMovies,
  journalEntries,
}: BuildCollectionsInput): CollectionView[] {
  return collections.map((collection) => {
    const collectionMovies = resolveCollectionMovies({
      collection,
      movies,
      userMovies,
      journalEntries,
    });

    return {
      collection,
      movies: collectionMovies,
      stats: buildCollectionStats({
        movies: collectionMovies,
        userMovies,
        journalEntries,
      }),
    };
  });
}

export function buildCollectionStats({
  movies,
  userMovies,
  journalEntries,
}: {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
}): CollectionStats {
  const movieIds = new Set(movies.map((movie) => movie.id));
  const ratingValues = userMovies
    .filter((userMovie) => movieIds.has(userMovie.movieId))
    .map((userMovie) => userMovie.myRating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);

  return {
    movieCount: movies.length,
    countryCount: new Set(movies.map((movie) => movie.country)).size,
    directorCount: new Set(movies.map((movie) => movie.director)).size,
    averageRating:
      ratingValues.length > 0
        ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
        : undefined,
    journalCount: journalEntries.filter((entry) => movieIds.has(entry.movieId)).length,
  };
}

function resolveCollectionMovies({
  collection,
  movies,
  userMovies,
  journalEntries,
}: {
  collection: Collection;
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
}) {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));

  if (collection.movieIds) {
    return collection.movieIds
      .map((movieId) => movieById.get(movieId))
      .filter((movie): movie is Movie => Boolean(movie));
  }

  if (!collection.rule) return [];

  return movies.filter((movie) => {
    const userMovie = userMovies.find((item) => item.movieId === movie.id);

    if (collection.rule?.type === "watchStatus") {
      return userMovie?.watchStatus === collection.rule.value;
    }

    if (collection.rule?.type === "favorite") {
      return userMovie?.favorite === collection.rule.value;
    }

    if (collection.rule?.type === "journaled") {
      return journalEntries.some((entry) => entry.movieId === movie.id);
    }

    if (collection.rule?.type === "ratingAtLeast") {
      return (
        typeof userMovie?.myRating === "number" &&
        typeof collection.rule.value === "number" &&
        userMovie.myRating >= collection.rule.value
      );
    }

    if (collection.rule?.type === "country") {
      return (
        movie.countrySlug === collection.rule.value ||
        movie.countryIds?.includes(String(collection.rule.value))
      );
    }

    if (collection.rule?.type === "award") {
      return (
        movie.awardSlugs?.includes(String(collection.rule.value)) ||
        movie.awardIds?.includes(String(collection.rule.value))
      );
    }

    if (collection.rule?.type === "genre") {
      return (movie.genres ?? [movie.genre]).some(
        (genre) => slugify(genre) === collection.rule?.value
      );
    }

    if (collection.rule?.type === "kind") {
      return journalEntries.some(
        (entry) =>
          entry.movieId === movie.id && entry.kind === collection.rule?.value
      );
    }

    return false;
  });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

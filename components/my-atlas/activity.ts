import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

export type ActivityItem = {
  userMovie: UserMovie;
  movie?: Movie;
  date: string;
};

export type ActivityDayGroup = {
  date: string;
  items: ActivityItem[];
};

export type ActivityMonthGroup = {
  year: string;
  month: string;
  days: ActivityDayGroup[];
};

export function buildActivityItems({
  movies,
  userMovies,
}: {
  movies: Movie[];
  userMovies: UserMovie[];
}) {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));

  return userMovies
    .filter((item) => Boolean(item.watchedDate))
    .map((userMovie) => ({
      userMovie,
      movie: movieById.get(userMovie.movieId),
      date: userMovie.watchedDate as string,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function groupActivityByDay(items: ActivityItem[]): ActivityDayGroup[] {
  const groups = new Map<string, ActivityItem[]>();

  items.forEach((item) => {
    const current = groups.get(item.date) ?? [];
    groups.set(item.date, [...current, item]);
  });

  return Array.from(groups.entries()).map(([date, dayItems]) => ({
    date,
    items: dayItems,
  }));
}

export function groupActivityByMonth(
  items: ActivityItem[]
): ActivityMonthGroup[] {
  const monthGroups = new Map<string, ActivityDayGroup[]>();

  groupActivityByDay(items).forEach((day) => {
    const date = new Date(`${day.date}T00:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const current = monthGroups.get(key) ?? [];
    monthGroups.set(key, [...current, day]);
  });

  return Array.from(monthGroups.entries()).map(([key, days]) => {
    const [year, monthIndex] = key.split("-").map(Number);
    const date = new Date(year, monthIndex, 1);

    return {
      year: `${year}`,
      month: date.toLocaleString("en", { month: "long" }),
      days,
    };
  });
}

export function formatActivityDate(date: string) {
  return date.replaceAll("-", ".");
}

export function formatShortActivityDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleString("en", {
    month: "short",
    day: "numeric",
  });
}

export function formatRating(rating?: number) {
  if (!rating || rating <= 0) return "Not rated";

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));

  return `${"★".repeat(fullStars)}${hasHalf ? "☆" : ""}${"·".repeat(
    emptyStars
  )}`;
}

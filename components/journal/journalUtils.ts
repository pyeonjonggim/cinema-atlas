import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

export type JournalViewItem = {
  entry: JournalEntry;
  movie?: Movie;
  userMovie?: UserMovie;
};

export type JournalDayGroup = {
  date: string;
  items: JournalViewItem[];
};

export type JournalMonthGroup = {
  year: string;
  month: string;
  days: JournalDayGroup[];
};

export function buildJournalItems({
  journalEntries,
  movies,
  userMovies,
}: {
  journalEntries: JournalEntry[];
  movies: Movie[];
  userMovies: UserMovie[];
}): JournalViewItem[] {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const userMovieByMovieId = new Map(
    userMovies.map((userMovie) => [userMovie.movieId, userMovie])
  );

  return [...journalEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => ({
      entry,
      movie: movieById.get(entry.movieId),
      userMovie: userMovieByMovieId.get(entry.movieId),
    }));
}

export function groupJournalByMonth(
  items: JournalViewItem[]
): JournalMonthGroup[] {
  const monthGroups = new Map<string, JournalDayGroup[]>();

  groupJournalByDay(items).forEach((day) => {
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

function groupJournalByDay(items: JournalViewItem[]): JournalDayGroup[] {
  const dayGroups = new Map<string, JournalViewItem[]>();

  items.forEach((item) => {
    const current = dayGroups.get(item.entry.date) ?? [];
    dayGroups.set(item.entry.date, [...current, item]);
  });

  return Array.from(dayGroups.entries()).map(([date, dayItems]) => ({
    date,
    items: dayItems,
  }));
}

export function formatJournalDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleString("en", {
    month: "short",
    day: "numeric",
  });
}

export function formatJournalRating(rating?: number) {
  if (!rating || rating <= 0) return "Not rated";

  return `${rating.toFixed(1)} / 5`;
}

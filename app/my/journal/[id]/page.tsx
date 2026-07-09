import MyJournalDetailPage from "@/components/pages/MyJournalDetailPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

type MyJournalDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MyJournalDetailRoute({
  params,
}: MyJournalDetailRouteProps) {
  const { id } = await params;
  const entry = journalEntries.find((journalEntry) => journalEntry.id === id);

  const movie = movies.find((item) => item.id === entry?.movieId);
  const userMovie = userMovies.find((item) => item.movieId === entry?.movieId);

  return (
    <MyJournalDetailPage
      entry={entry}
      entryId={id}
      movie={movie}
      userMovie={userMovie}
      journalEntries={journalEntries}
      movies={movies}
      userMovies={userMovies}
    />
  );
}

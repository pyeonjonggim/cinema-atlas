import MyJournalPage from "@/components/pages/MyJournalPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

export default function MyJournalRoute() {
  return (
    <MyJournalPage
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
    />
  );
}

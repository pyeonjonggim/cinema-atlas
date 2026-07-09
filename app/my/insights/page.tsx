import MyInsightsPage from "@/components/pages/MyInsightsPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

export default function MyInsightsRoute() {
  return (
    <MyInsightsPage
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
    />
  );
}

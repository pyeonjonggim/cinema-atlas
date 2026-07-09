import MyAtlasDashboardPage from "@/components/pages/MyAtlasDashboardPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

export default function MyPage() {
  return (
    <MyAtlasDashboardPage
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
    />
  );
}

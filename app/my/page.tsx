import MyAtlasDashboardPage from "@/components/pages/MyAtlasDashboardPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { listPublishedJourneys } from "@/lib/journeyQuery";

export default async function MyPage() {
  const journeys = await listPublishedJourneys();

  return (
    <MyAtlasDashboardPage
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
      journeys={journeys}
    />
  );
}

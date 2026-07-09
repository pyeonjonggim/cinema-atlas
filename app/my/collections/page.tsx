import MyCollectionsPage from "@/components/pages/MyCollectionsPage";
import { collections } from "@/data/collections";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

export default function MyCollectionsRoute() {
  return (
    <MyCollectionsPage
      collections={collections}
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
    />
  );
}

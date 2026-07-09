import MyAtlasActivityPage from "@/components/pages/MyAtlasActivityPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

export default function MyActivityRoute() {
  return (
    <MyAtlasActivityPage
      movies={movies}
      userMovies={userMovies}
      journalEntries={journalEntries}
    />
  );
}

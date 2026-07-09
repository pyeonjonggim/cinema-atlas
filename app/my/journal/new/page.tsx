import MyJournalNewPage from "@/components/pages/MyJournalNewPage";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";

type MyJournalNewRouteProps = {
  searchParams: Promise<{
    movie?: string;
  }>;
};

export default async function MyJournalNewRoute({
  searchParams,
}: MyJournalNewRouteProps) {
  const { movie: movieId } = await searchParams;
  const movie = movies.find((item) => item.id === movieId);
  const userMovie = userMovies.find((item) => item.movieId === movieId);

  return <MyJournalNewPage movie={movie} userMovie={userMovie} />;
}

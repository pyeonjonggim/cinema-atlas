import { notFound } from "next/navigation";

import MovieDetailPage from "@/components/pages/MovieDetailPage";
import { awards } from "@/data/awards";
import { movements } from "@/data/movements";
import { getActors, getCountries, getDirectors, getMovieBySlug, getMovies } from "@/lib/catalogQuery";

type MovieDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MovieDetailRoute({
  params,
}: MovieDetailRouteProps) {
  const { id } = await params;
  const movie = await getMovieBySlug(id);

  if (!movie) {
    notFound();
  }

  const movies = await getMovies();
  const directors = await getDirectors();
  const actors = await getActors();
  const countries = await getCountries();

  return (
    <MovieDetailPage
      movie={movie}
      movies={movies}
      directors={directors}
      countries={countries}
      movements={movements}
      actors={actors}
      awards={awards}
    />
  );
}

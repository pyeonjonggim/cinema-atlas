import { notFound } from "next/navigation";

import MovieDetailPage from "@/components/pages/MovieDetailPage";
import { actors } from "@/data/actors";
import { awards } from "@/data/awards";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movements } from "@/data/movements";
import { getMovieById, listMovies } from "@/lib/catalogQuery";

type MovieDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MovieDetailRoute({
  params,
}: MovieDetailRouteProps) {
  const { id } = await params;
  const movie = getMovieById(id);
  const movies = listMovies();

  if (!movie) {
    notFound();
  }

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

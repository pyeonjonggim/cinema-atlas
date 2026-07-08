import { notFound } from "next/navigation";

import MovieDetailPage from "@/components/pages/MovieDetailPage";
import { actors } from "@/data/actors";
import { awards } from "@/data/awards";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movements } from "@/data/movements";
import { movies } from "@/data/movies";

type MovieDetailRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MovieDetailRoute({
  params,
}: MovieDetailRouteProps) {
  const { id } = await params;
  const movie = movies.find((item) => item.id === id);

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

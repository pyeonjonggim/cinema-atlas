import { notFound } from "next/navigation";

import MovementDetailPage from "@/components/pages/MovementDetailPage";
import { getCountries, getDirectors, getMovementBySlug, getMovements, getMovies } from "@/lib/catalogQuery";

type MovementRouteProps = {
  params: Promise<{
    movement: string;
  }>;
};

export default async function MovementRoute({ params }: MovementRouteProps) {
  const { movement: movementSlug } = await params;
  const [movement, movements, countries, directors, movies] = await Promise.all([
    getMovementBySlug(movementSlug),
    getMovements(),
    getCountries(),
    getDirectors(),
    getMovies(),
  ]);

  if (!movement) {
    notFound();
  }

  return (
    <MovementDetailPage
      movement={movement}
      movements={movements}
      countries={countries}
      directors={directors}
      movies={movies}
    />
  );
}
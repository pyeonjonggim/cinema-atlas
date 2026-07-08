import { notFound } from "next/navigation";

import MovementDetailPage from "@/components/pages/MovementDetailPage";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movements } from "@/data/movements";
import { movies } from "@/data/movies";

type MovementRouteProps = {
  params: Promise<{
    movement: string;
  }>;
};

export default async function MovementRoute({ params }: MovementRouteProps) {
  const { movement: movementSlug } = await params;
  const movement = movements.find((item) => item.slug === movementSlug);

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

import { notFound } from "next/navigation";

import AwardDetailPage from "@/components/pages/AwardDetailPage";
import { awards } from "@/data/awards";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movies } from "@/data/movies";

type AwardRouteProps = {
  params: Promise<{
    award: string;
  }>;
};

export default async function AwardRoute({ params }: AwardRouteProps) {
  const { award: awardSlug } = await params;
  const award = awards.find((item) => item.slug === awardSlug);

  if (!award) {
    notFound();
  }

  return (
    <AwardDetailPage
      award={award}
      awards={awards}
      countries={countries}
      directors={directors}
      movies={movies}
    />
  );
}

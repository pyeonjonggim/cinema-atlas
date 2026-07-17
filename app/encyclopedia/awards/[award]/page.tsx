import { notFound } from "next/navigation";

import AwardDetailPage from "@/components/pages/AwardDetailPage";
import { getAwardBySlug, getAwards, getCountries, getDirectors, getMovies } from "@/lib/catalogQuery";

type AwardRouteProps = {
  params: Promise<{
    award: string;
  }>;
};

export default async function AwardRoute({ params }: AwardRouteProps) {
  const { award: awardSlug } = await params;
  const [award, awards, countries, directors, movies] = await Promise.all([
    getAwardBySlug(awardSlug),
    getAwards(),
    getCountries(),
    getDirectors(),
    getMovies(),
  ]);

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
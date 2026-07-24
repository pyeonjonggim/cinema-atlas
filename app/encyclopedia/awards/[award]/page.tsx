import { notFound } from "next/navigation";

import AwardDetailPage from "@/components/pages/AwardDetailPage";
import {
  getAwardBySlug,
  getAwards,
  getCountriesBySlugs,
  getDirectorsBySlugs,
  getMoviesByReferences,
} from "@/lib/catalogQuery";

export const dynamic = "force-dynamic";

type AwardRouteProps = {
  params: Promise<{
    award: string;
  }>;
};

export default async function AwardRoute({ params }: AwardRouteProps) {
  const { award: awardSlug } = await params;
  const award = await getAwardBySlug(awardSlug);

  if (!award) {
    notFound();
  }

  const movies = await getMoviesByReferences([
    ...award.representativeMovieIds,
    award.starterMovieId,
  ].filter((item): item is string => Boolean(item)));
  const [awards, countries, directors] = await Promise.all([
    getAwards(),
    getCountriesBySlugs([
      award.countrySlug,
      ...movies.map((movie) => movie.countrySlug),
    ].filter((item): item is string => Boolean(item))),
    getDirectorsBySlugs(award.directorSlugs),
  ]);

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

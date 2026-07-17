import { notFound } from "next/navigation";

import CountryDetailPage from "@/components/pages/CountryDetailPage";
import { movements } from "@/data/movements";
import { getCountryBySlug, getCountryMovies } from "@/lib/catalogQuery";

type CountryRouteProps = {
  params: Promise<{
    country: string;
  }>;
};

export default async function CountryRoute({ params }: CountryRouteProps) {
  const { country: countrySlug } = await params;
  const country = await getCountryBySlug(countrySlug);

  if (!country) {
    notFound();
  }

  const movies = await getCountryMovies(countrySlug);

  return (
    <CountryDetailPage
      country={country}
      countries={[country]}
      directors={[]}
      movements={movements}
      movies={movies}
    />
  );
}

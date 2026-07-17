import { notFound } from "next/navigation";

import CountryDetailPage from "@/components/pages/CountryDetailPage";
import { movements } from "@/data/movements";
import { getCountries, getCountryBySlug, getDirectors, getMovies } from "@/lib/catalogQuery";

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

  const countries = await getCountries();
  const directors = await getDirectors();
  const movies = await getMovies();

  return (
    <CountryDetailPage
      country={country}
      countries={countries}
      directors={directors}
      movements={movements}
      movies={movies}
    />
  );
}

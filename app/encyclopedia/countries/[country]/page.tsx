import { notFound } from "next/navigation";

import CountryDetailPage from "@/components/pages/CountryDetailPage";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movements } from "@/data/movements";
import { listMovies } from "@/lib/catalogQuery";

type CountryRouteProps = {
  params: Promise<{
    country: string;
  }>;
};

export default async function CountryRoute({ params }: CountryRouteProps) {
  const { country: countrySlug } = await params;
  const country = countries.find((item) => item.slug === countrySlug);

  if (!country) {
    notFound();
  }

  return (
    <CountryDetailPage
      country={country}
      countries={countries}
      directors={directors}
      movements={movements}
      movies={listMovies()}
    />
  );
}

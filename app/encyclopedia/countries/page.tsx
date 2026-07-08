import { countries } from "@/data/countries";
import { movies } from "@/data/movies";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import ListHero from "@/components/layout/ListHero";
import CountryEncyclopediaList from "@/components/CountryEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";

const countryItems = countries.map((country) => {
  const relatedMovieCount = movies.filter(
    (movie) => movie.countrySlug === country.slug
  ).length;

  return {
    slug: country.slug,
    name: country.name,
    nameKo: country.nameKo,
    flag: country.flag,
    region: country.region,
    description: country.description,
    relatedMovieCount,
    essentialMovieCount: relatedMovieCount,
  };
});

export default function CountriesPage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <ListHero
            eyebrow="Countries"
            title="Countries"
            description="Discover cinema through countries."
            searchPlaceholder="Search countries..."
            totalLabel={`${countries.length} Countries`}
          />

          <CountryEncyclopediaList countries={countryItems} />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Explore cinema through regions, countries, and national film histories."
          >
            <JourneyCard
              href="/explore/asian-cinema"
              category="Region Guide"
              title="Asian Cinema Journey"
              subtitle="Move through Japan, Korea, Iran, China, and beyond."
              difficulty="Beginner"
              stops={8}
              movieCount={12}
              viewingTime="18h"
            />

            <JourneyCard
              href="/explore/european-cinema"
              category="Region Guide"
              title="European Cinema Guide"
              subtitle="Explore France, Italy, Germany, Sweden, and major movements."
              difficulty="Intermediate"
              stops={10}
              movieCount={14}
              viewingTime="22h"
            />

            <JourneyCard
              href="/explore/world-cinema-map"
              category="Atlas Route"
              title="World Cinema Map"
              subtitle="Start from countries and connect to directors, movements, and awards."
              difficulty="Beginner"
              stops={12}
              movieCount={16}
              viewingTime="24h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}
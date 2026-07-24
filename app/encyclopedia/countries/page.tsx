import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import CountryEncyclopediaList from "@/components/CountryEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { getCountries, getCountryMovieCounts } from "@/lib/catalogQuery";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const countries = await getCountries();
  const countryMovieCounts = await getCountryMovieCounts();
  const countryItems = countries.map((country) => {
    const relatedMovieCount = countryMovieCounts[country.slug] ?? 0;

    return {
      slug: country.slug,
      name: country.name,
      nameKo: country.nameKo,
      flag: country.flag,
      region: country.region,
      description: country.description,
      knownFor: [country.knownFor],
      relatedMovieCount,
      essentialMovieCount: relatedMovieCount,
    };
  });

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <CountryEncyclopediaList
            countries={countryItems}
            hero={{
              eyebrow: "Countries",
              title: "Countries",
              description: "Discover cinema through countries.",
              searchPlaceholder: "Search countries...",
              totalLabel: `${countries.length} Countries`,
            }}
          />

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

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import DirectorEncyclopediaList from "@/components/DirectorEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { getDirectors } from "@/lib/catalogQuery";
import type { EntityImage } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function DirectorsPage() {
  const directors = await getDirectors();
  const directorItems = directors.map((director) => {
    const directorMedia = director as typeof director & {
      profileImage?: EntityImage | null;
    };
    const relatedMovieCount = director.knownForMovieIds.length;

    return {
      slug: director.slug,
      name: director.name,
      nameKo: director.nameKo,
      country: director.country,
      countryFlag: director.countryFlag,
      description: director.description,
      styleKeywords: director.styleKeywords,
      relatedMovieCount,
      essentialMovieCount: director.knownForMovieIds.length,
      profileImage: directorMedia.profileImage,
    };
  });

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <DirectorEncyclopediaList
            directors={directorItems}
            hero={{
              eyebrow: "Directors",
              title: "Directors",
              description: "Explore filmmakers across history.",
              searchPlaceholder: "Search directors...",
              totalLabel: `${directors.length} Directors`,
            }}
          />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Dive deeper into the world of filmmaking."
          >
            <JourneyCard
              href="/explore/great-directors"
              category="Collection"
              title="Great Directors of World Cinema"
              subtitle="Explore essential filmmakers across film history."
              difficulty="Beginner"
              stops={20}
              movieCount={20}
              viewingTime="30h"
            />

            <JourneyCard
              href="/explore/women-directors"
              category="Collection"
              title="Women Directors You Should Know"
              subtitle="Discover major women filmmakers across countries and eras."
              difficulty="Intermediate"
              stops={18}
              movieCount={18}
              viewingTime="26h"
            />

            <JourneyCard
              href="/explore/directors-by-decade"
              category="Era"
              title="Directors by Decade"
              subtitle="Explore filmmakers through different historical periods."
              difficulty="Beginner"
              stops={10}
              movieCount={10}
              viewingTime="16h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}

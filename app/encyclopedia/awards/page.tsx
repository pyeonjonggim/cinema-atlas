import AwardEncyclopediaList from "@/components/AwardEncyclopediaList";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { getAwards } from "@/lib/catalogQuery";

export default async function AwardsPage() {
  const awardItems = (await getAwards()).map((award) => ({
    slug: award.slug,
    name: award.name,
    nameKo: award.name,
    organization: award.organization,
    region: award.organization,
    type: "Award / Institution",
    description: award.description,
    foundedYear: award.foundedYear,
  }));

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <AwardEncyclopediaList
            awards={awardItems}
            hero={{
              eyebrow: "Awards",
              title: "Awards",
              description: "Explore the world's major film awards.",
              searchPlaceholder: "Search awards...",
              totalLabel: `${awardItems.length} Awards`,
            }}
          />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Explore festivals, awards, and cinema history."
          >
            <JourneyCard
              href="/explore/major-film-festivals"
              category="Festival Guide"
              title="Major Film Festivals"
              subtitle="Explore Cannes, Venice, Berlin, and other major institutions."
              difficulty="Beginner"
              stops={8}
              movieCount={12}
              viewingTime="18h"
            />

            <JourneyCard
              href="/explore/oscar-best-picture"
              category="Award Route"
              title="Oscar Best Picture Winners"
              subtitle="Follow the history of the Academy's most recognized films."
              difficulty="Intermediate"
              stops={15}
              movieCount={15}
              viewingTime="25h"
            />

            <JourneyCard
              href="/explore/cannes-history"
              category="Festival History"
              title="The History of Cannes"
              subtitle="Move through Palme d'Or winners and festival canon."
              difficulty="Intermediate"
              stops={10}
              movieCount={12}
              viewingTime="20h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}
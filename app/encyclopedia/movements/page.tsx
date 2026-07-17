import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import MovementEncyclopediaList from "@/components/MovementEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { getMovements } from "@/lib/catalogQuery";

export default async function MovementsPage() {
  const movementItems = await getMovements();

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <MovementEncyclopediaList
            movements={movementItems}
            hero={{
              eyebrow: "Movements",
              title: "Movements",
              description: "Explore the evolution of film language.",
              searchPlaceholder: "Search movements...",
              totalLabel: `${movementItems.length} Movements`,
            }}
          />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Dive deeper into film history and cinematic movements."
          >
            <JourneyCard
              href="/explore/film-history-timeline"
              category="Timeline"
              title="Film History Timeline"
              subtitle="Follow the major shifts in film language across decades."
              difficulty="Beginner"
              stops={12}
              movieCount={18}
              viewingTime="28h"
            />

            <JourneyCard
              href="/explore/key-movements"
              category="Collection"
              title="Key Movements in World Cinema"
              subtitle="Explore the essential movements that shaped cinema."
              difficulty="Intermediate"
              stops={10}
              movieCount={14}
              viewingTime="22h"
            />

            <JourneyCard
              href="/explore/avant-garde"
              category="Deep Dive"
              title="Avant-Garde & Experimental Cinema"
              subtitle="Move through radical forms, images, and cinematic ideas."
              difficulty="Advanced"
              stops={8}
              movieCount={10}
              viewingTime="16h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}
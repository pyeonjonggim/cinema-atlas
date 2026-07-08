import { movies } from "@/data/movies";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import ListHero from "@/components/layout/ListHero";
import MovementEncyclopediaList from "@/components/MovementEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";

const movementMap = new Map<
  string,
  {
    slug: string;
    name: string;
    country?: string;
    period?: string;
    description?: string;
    relatedMovieCount: number;
    essentialMovieCount: number;
  }
>();

movies.forEach((movie) => {
  const existing = movementMap.get(movie.movementSlug);

  if (existing) {
    movementMap.set(movie.movementSlug, {
      ...existing,
      relatedMovieCount: existing.relatedMovieCount + 1,
      essentialMovieCount: existing.essentialMovieCount + 1,
    });
  } else {
    movementMap.set(movie.movementSlug, {
      slug: movie.movementSlug,
      name: movie.movement,
      country: movie.country,
      description: `${movie.movement} 흐름에 속한 작품들을 탐험합니다.`,
      relatedMovieCount: 1,
      essentialMovieCount: 1,
    });
  }
});

const movementItems = Array.from(movementMap.values());

export default function MovementsPage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <ListHero
            eyebrow="Movements"
            title="Movements"
            description="Explore the evolution of film language."
            searchPlaceholder="Search movements..."
            totalLabel={`${movementItems.length} Movements`}
          />

          <MovementEncyclopediaList movements={movementItems} />

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
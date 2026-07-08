import { movies } from "@/data/movies";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import ListHero from "@/components/layout/ListHero";
import ActorEncyclopediaList from "@/components/ActorEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";

const actorMap = new Map<
  string,
  {
    slug: string;
    name: string;
    country?: string;
    countryFlag?: string;
    description?: string;
    relatedMovieCount: number;
  }
>();

movies.forEach((movie) => {
  movie.actorSlugs.forEach((actorSlug, index) => {
    const actorName = movie.actors[index];

    if (!actorName) return;

    const existing = actorMap.get(actorSlug);

    if (existing) {
      actorMap.set(actorSlug, {
        ...existing,
        relatedMovieCount: existing.relatedMovieCount + 1,
      });
    } else {
      actorMap.set(actorSlug, {
        slug: actorSlug,
        name: actorName,
        country: movie.country,
        countryFlag: movie.countryFlag,
        description: `${movie.title}를 통해 연결된 배우입니다.`,
        relatedMovieCount: 1,
      });
    }
  });
});

const actorItems = Array.from(actorMap.values());

export default function ActorsPage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <ListHero
            eyebrow="Actors"
            title="Actors"
            description="Discover iconic performances."
            searchPlaceholder="Search actors..."
            totalLabel={`${actorItems.length} Actors`}
          />

          <ActorEncyclopediaList actors={actorItems} />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Explore performers, roles, and cinematic screen presence."
          >
            <JourneyCard
              href="/explore/legendary-performers"
              category="Collection"
              title="Legendary Performers"
              subtitle="Move through iconic actors and defining performances."
              difficulty="Beginner"
              stops={12}
              movieCount={16}
              viewingTime="24h"
            />

            <JourneyCard
              href="/explore/award-winning-performances"
              category="Award Route"
              title="Award Winning Performances"
              subtitle="Explore performances recognized by major festivals and awards."
              difficulty="Intermediate"
              stops={10}
              movieCount={12}
              viewingTime="18h"
            />

            <JourneyCard
              href="/explore/actors-by-decade"
              category="Era"
              title="Actors by Decade"
              subtitle="Discover screen icons across different historical periods."
              difficulty="Beginner"
              stops={8}
              movieCount={10}
              viewingTime="15h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}
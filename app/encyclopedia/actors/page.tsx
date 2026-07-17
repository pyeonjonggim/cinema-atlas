import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import ActorEncyclopediaList from "@/components/ActorEncyclopediaList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { getActors, getMovies } from "@/lib/catalogQuery";

export default async function ActorsPage() {
  const actors = await getActors();
  const movies = await getMovies();
  const actorItems = actors.map((actor) => {
    const relatedMovieCount = movies.filter((movie) =>
      [movie.actorSlugs, movie.actorIds ?? []].flat().includes(actor.slug),
    ).length;

    return {
      slug: actor.slug,
      name: actor.name,
      nameKo: actor.nameKo,
      country: actor.countrySlug,
      description: actor.description,
      screenPersona: actor.screenPersona,
      relatedMovieCount,
    };
  });

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <ActorEncyclopediaList
            actors={actorItems}
            hero={{
              eyebrow: "Actors",
              title: "Actors",
              description: "Discover iconic performances.",
              searchPlaceholder: "Search actors...",
              totalLabel: `${actorItems.length} Actors`,
            }}
          />

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

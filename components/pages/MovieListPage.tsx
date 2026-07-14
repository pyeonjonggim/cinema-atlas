import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import MovieList from "@/components/MovieList";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";
import JourneyCard from "@/components/discovery/JourneyCard";
import { listMovies } from "@/lib/catalogQuery";

export default function MovieListPage() {
  const movies = listMovies();

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-12">
          <MovieList
            movies={movies}
            hero={{
              eyebrow: "Encyclopedia",
              title: "Movies",
              description: "Discover films from around the world.",
              searchPlaceholder: "Search movies...",
              totalLabel: `${movies.length} Movies`,
            }}
          />

          <RecommendedShelfPattern
            title="Continue Exploring"
            description="Discover new collections to continue your cinema journey."
          >
            <JourneyCard
              href="/explore/japanese-cinema"
              category="Starter Collection"
              title="Japanese Cinema Starter"
              subtitle="Begin your journey through Japanese cinema."
              difficulty="Beginner"
              stops={8}
              movieCount={8}
              viewingTime="12h"
            />

            <JourneyCard
              href="/explore/oscar-winners"
              category="Award Collection"
              title="Oscar Best Picture Collection"
              subtitle="Explore the history of Academy Award winners."
              difficulty="Intermediate"
              stops={24}
              movieCount={24}
              viewingTime="40h"
            />

            <JourneyCard
              href="/explore/directors"
              category="Directors"
              title="Directors You Should Know"
              subtitle="Essential filmmakers from around the world."
              difficulty="Intermediate"
              stops={12}
              movieCount={12}
              viewingTime="18h"
            />
          </RecommendedShelfPattern>
        </div>
      </PageContainer>
    </>
  );
}

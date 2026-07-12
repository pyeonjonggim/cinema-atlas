import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import ExplorerCountryBoard from "@/components/passport/ExplorerCountryBoard";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Movie } from "@/types/movie";
import type {
  ExplorerCountryProgress,
  ExplorerRegionProgress,
} from "@/types/passport";
import type { UserMovie } from "@/types/userMovie";

type PassportExplorerMapPageProps = {
  countries: ExplorerCountryProgress[];
  regions: ExplorerRegionProgress[];
  movies: Movie[];
  userMovies: UserMovie[];
};

export default function PassportExplorerMapPage({
  countries,
  regions,
  movies,
  userMovies,
}: PassportExplorerMapPageProps) {
  const exploredCountries = countries.filter((country) => country.watchedCount > 0);
  const mostExploredCountry = exploredCountries[0];
  const recentCountryActivity = getRecentCountryActivity({
    countries,
    movies,
    userMovies,
  });
  const unexploredRegions = regions
    .filter((region) => region.watchedMovieCount === 0 || region.exploredCountryCount === 0)
    .slice(0, 4);

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow="Explorer Map"
            title="World Exploration"
            description="A spatial view of the countries and regions represented in your completed films. This tracks Cinema Atlas catalog progress, not cinema as a whole."
          />

          <Section
            title="World Overview"
            description="A compact summary of your recorded country exploration."
            className="p-4 md:p-5"
          >
            {exploredCountries.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Countries Explored" value={String(exploredCountries.length)} />
                <SummaryCard
                  label="Regions Reached"
                  value={String(regions.filter((region) => region.watchedMovieCount > 0).length)}
                />
                <SummaryCard
                  label="Movies Across Countries"
                  value={String(exploredCountries.reduce((sum, country) => sum + country.watchedCount, 0))}
                />
                <SummaryCard
                  label="Most Explored Country"
                  value={mostExploredCountry?.countryName ?? "None yet"}
                />
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No countries explored yet."
                description="Start with a country, film, or guided journey."
                actionLabel="Explore Countries"
                actionHref="/encyclopedia/countries"
              />
            )}
          </Section>

          <Section
            title="Region Overview"
            description="Regions group countries by broad exploration context."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {regions.map((region) => (
                <AtlasCard key={region.regionId} className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {region.status}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {region.regionId}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-400">
                    {region.exploredCountryCount} / {region.totalCountryCount} countries started
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {region.watchedMovieCount} recorded films · {region.progressPercent}% catalog progress
                  </p>
                </AtlasCard>
              ))}
            </div>
          </Section>

          <Section
            title="Country Explorer Board"
            description="Country cards summarize exploration status. Deeper history belongs in the Country Encyclopedia."
            className="p-4 md:p-5"
          >
            <ExplorerCountryBoard countries={countries} />
          </Section>

          <Section
            title="Unexplored Regions"
            description="Open spaces in your current Passport map."
            className="p-4 md:p-5"
          >
            {unexploredRegions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {unexploredRegions.map((region) => (
                  <AtlasCard key={region.regionId} href="/encyclopedia/countries" className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Start Exploring
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {region.regionId}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      {region.totalCountryCount} countries are available in the current Atlas catalog.
                    </p>
                  </AtlasCard>
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="Every catalog region has started."
                description="Continue deepening countries through directors, decades, and movements."
              />
            )}
          </Section>

          <Section
            title="Recent Country Activity"
            description="Recent completed films viewed through country exploration."
            className="p-4 md:p-5"
          >
            {recentCountryActivity.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {recentCountryActivity.map((item) => (
                  <AtlasCard key={`${item.movie.id}-${item.date}`} href={`/movies/${item.movie.id}`} className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {item.country.countryName}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {item.movie.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">{item.date}</p>
                  </AtlasCard>
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No recent country activity yet."
                description="Completed films will appear here through their country context."
              />
            )}
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Use the map as a guide toward another meaningful destination."
            items={[
              {
                label: "Countries",
                title: "Explore Country Encyclopedia",
                description: "Deepen the context behind national cinemas.",
                href: "/encyclopedia/countries",
                level: "primary",
              },
              {
                label: "Journeys",
                title: "Browse Country Journeys",
                description: "Start a guided exploration from Explore.",
                href: "/explore/journeys",
                level: "deep",
              },
              {
                label: "Passport",
                title: "Return to Passport",
                description: "Review challenges, achievements, and history.",
                href: "/passport",
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <AtlasCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </AtlasCard>
  );
}

function getRecentCountryActivity({
  countries,
  movies,
  userMovies,
}: {
  countries: ExplorerCountryProgress[];
  movies: Movie[];
  userMovies: UserMovie[];
}) {
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));

  return userMovies
    .filter((userMovie) => userMovie.watchStatus === "completed" && userMovie.watchedDate)
    .map((userMovie) => {
      const movie = movieById.get(userMovie.movieId);
      const country = countries.find((item) =>
        movie ? (movie.countryIds ?? [movie.countrySlug]).includes(item.countryId) : false
      );

      if (!movie || !country || !userMovie.watchedDate) return undefined;

      return {
        movie,
        country,
        date: userMovie.watchedDate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
}

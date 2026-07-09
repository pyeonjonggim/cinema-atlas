import DistributionList from "@/components/insights/DistributionList";
import InsightCard from "@/components/insights/InsightCard";
import InsightGrid from "@/components/insights/InsightGrid";
import type { ReactNode } from "react";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import EmptyState from "@/components/ui/EmptyState";
import { buildMyInsights } from "@/lib/insights";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyInsightsPageProps = {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export default function MyInsightsPage({
  movies,
  userMovies,
  journalEntries,
}: MyInsightsPageProps) {
  const insights = buildMyInsights({ movies, userMovies, journalEntries });
  const topCountry = insights.countryDistribution[0];
  const topDirector = insights.directorDistribution[0];
  const topGenre = insights.genreDistribution[0];
  const topDecade = insights.decadeDistribution[0];

  return (
    <MyAtlasLayout>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          My Atlas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Insights
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
          Numbers first, patterns second, story third. A compact reading of
          your current cinema journey.
        </p>
      </section>

      {insights.moviesWatched === 0 ? (
        <EmptyState
          preset="journal"
          title="No insights yet."
          description="Watch and rate a film to begin seeing patterns in your Atlas."
        />
      ) : (
        <>
          <Section
            title="Key Numbers"
            description="The basic shape of your current record."
            className="p-4 md:p-5"
          >
            <InsightGrid>
              <InsightCard
                label="Movies Watched"
                value={`${insights.moviesWatched}`}
                note="Completed films in My Atlas."
              />
              <InsightCard
                label="Total Runtime"
                value={`${insights.totalRuntime} min`}
                note="Time spent with recorded films."
              />
              <InsightCard
                label="Average Rating"
                value={formatAverage(insights.averageRating)}
                note="Your personal rating tendency."
              />
              <InsightCard
                label="Journal Count"
                value={`${insights.journalCount}`}
                note="Memories written after watching."
              />
            </InsightGrid>
          </Section>

          <Section
            title="Taste Patterns"
            description="Where your record is starting to lean."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <InsightPanel title="Countries">
                <DistributionList items={insights.countryDistribution} limit={10} />
              </InsightPanel>
              <InsightPanel title="Directors">
                <DistributionList items={insights.directorDistribution} limit={10} />
              </InsightPanel>
              <InsightPanel title="Genres">
                <DistributionList items={insights.genreDistribution} limit={10} />
              </InsightPanel>
              <InsightPanel title="Ratings">
                <DistributionList items={insights.ratingDistribution} limit={5} />
              </InsightPanel>
            </div>
          </Section>

          <Section
            title="Timeline"
            description="A simple view of when your watched films and watching record cluster."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <InsightPanel title="Movies by Watch Year">
                <DistributionList items={insights.watchedYearDistribution} />
              </InsightPanel>
              <InsightPanel title="Movies per Month">
                <DistributionList items={insights.watchedMonthDistribution} />
              </InsightPanel>
              <InsightPanel title="Movies by Decade">
                <DistributionList items={insights.decadeDistribution} />
              </InsightPanel>
            </div>
          </Section>

          <Section
            title="Discovery Insights"
            description="Short interpretations that turn numbers into direction."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {insights.storyInsights.map((insight) => (
                <div
                  key={insight}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-neutral-300"
                >
                  {insight}
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Ratings"
            description="Your strongest and quietest responses so far."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <MovieRatingList title="Highest Rated Movies" items={insights.highestRatedMovies} />
              <MovieRatingList title="Lowest Rated Movies" items={insights.lowestRatedMovies} />
            </div>
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Use your record as a doorway back into the Encyclopedia."
            items={[
              {
                label: "Country",
                title: topCountry
                  ? `Explore ${topCountry.label} Cinema`
                  : "Explore World Cinema",
                description: topCountry
                  ? `${topCountry.label} is your strongest country pattern so far.`
                  : "Start broad and let your record grow.",
                href: topCountry
                  ? `/encyclopedia/countries/${slugify(topCountry.label)}`
                  : "/encyclopedia/countries",
                level: "primary",
              },
              {
                label: "Director",
                title: topDirector
                  ? `Return to ${topDirector.label}`
                  : "Browse Directors",
                description:
                  insights.firstDirector && insights.latestDirector
                    ? `Your path runs from ${insights.firstDirector} to ${insights.latestDirector}.`
                    : "Find the filmmakers shaping your record.",
                href: topDirector
                  ? `/encyclopedia/directors/${slugify(topDirector.label)}`
                  : "/encyclopedia/directors",
              },
              {
                label: "Pattern",
                title: topGenre ?? topDecade ? "Follow the Pattern" : "Explore Movies",
                description:
                  topGenre && topDecade
                    ? `${topGenre.label} and ${topDecade.label} are visible in your Atlas.`
                    : "Open another film and create the next data point.",
                href: "/encyclopedia/movies",
                level: "deep",
              },
            ]}
          />
        </>
      )}
    </MyAtlasLayout>
  );
}

function InsightPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MovieRatingList({
  title,
  items,
}: {
  title: string;
  items: Array<{ movie: Movie; rating: number }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${title}-${item.movie.id}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="line-clamp-1 text-neutral-300">{item.movie.title}</span>
            <span className="text-neutral-500">{item.rating.toFixed(1)} / 5</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAverage(rating?: number) {
  return typeof rating === "number" ? rating.toFixed(2) : "Not rated";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

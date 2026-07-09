import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import InsightCard from "@/components/insights/InsightCard";
import InsightGrid from "@/components/insights/InsightGrid";
import JournalPreview from "@/components/journal/JournalPreview";
import MyActivityPreview from "@/components/my-atlas/MyActivityPreview";
import { buildActivityItems } from "@/components/my-atlas/activity";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import { buildMyInsights } from "@/lib/insights";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyAtlasDashboardPageProps = {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export default function MyAtlasDashboardPage({
  movies,
  userMovies,
  journalEntries,
}: MyAtlasDashboardPageProps) {
  const activityItems = buildActivityItems({ movies, userMovies });
  const insights = buildMyInsights({ movies, userMovies, journalEntries });
  const topCountry = insights.countryDistribution[0];
  const topDirector = insights.directorDistribution[0];

  return (
    <MyAtlasLayout>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          My Atlas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          My Atlas
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
          Your personal journey through cinema.
        </p>
      </section>

      <Section
        title="My Activity"
        description="Your recent cinema activity, led by posters before text."
        action={
          <AtlasButton href="/my/activity" variant="secondary">
            View Full Activity
          </AtlasButton>
        }
        className="p-4 md:p-5"
      >
        <MyActivityPreview
          items={activityItems}
          journalEntries={journalEntries}
          limit={10}
        />
      </Section>

      <Section
        title="Journal"
        description="Recent reflections from your personal cinema journal."
        action={
          <AtlasButton href="/my/journal" variant="secondary">
            View All
          </AtlasButton>
        }
        className="p-4 md:p-5"
      >
        <JournalPreview
          journalEntries={journalEntries}
          movies={movies}
          userMovies={userMovies}
          limit={6}
        />
      </Section>

      <Section
        title="Passport Progress"
        description="Progress will connect your personal history to long-term exploration."
        className="p-4 md:p-5"
      >
        <EmptyState
          preset="passport"
          title="Passport progress will appear here."
          description="Future progress will connect your watched films to countries, directors, movements, actors, and awards."
        />
      </Section>

      <Section
        title="My Collection"
        description="Favorites, watchlist, and lists will become your personal cinema shelves."
        className="p-4 md:p-5"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <CollectionPlaceholder title="Favorites" />
          <CollectionPlaceholder title="Watchlist" />
          <CollectionPlaceholder title="Lists" />
        </div>
      </Section>

      <Section
        title="Insights"
        description="Key numbers and early patterns from your personal cinema record."
        action={
          <AtlasButton href="/my/insights" variant="secondary">
            View All
          </AtlasButton>
        }
        className="p-4 md:p-5"
      >
        <InsightGrid>
          <InsightCard
            label="Movies Watched"
            value={`${insights.moviesWatched}`}
            note="Completed films in My Atlas."
          />
          <InsightCard
            label="Average Rating"
            value={
              typeof insights.averageRating === "number"
                ? insights.averageRating.toFixed(2)
                : "Not rated"
            }
            note="Your current rating pattern."
          />
          <InsightCard
            label="Most Watched Country"
            value={topCountry?.label ?? "None yet"}
            note={
              topCountry
                ? `${topCountry.percentage}% of watched films.`
                : "Watch more films to reveal this."
            }
          />
          <InsightCard
            label="Most Watched Director"
            value={topDirector?.label ?? "None yet"}
            note={
              topDirector
                ? `${topDirector.value} recorded film.`
                : "Your director pattern will appear here."
            }
          />
        </InsightGrid>
      </Section>

      <EntityContinueJourneyPattern
        title="Continue Exploring"
        description="Recommendations stay last. Use your activity as a quiet prompt for the next journey."
        items={[
          {
            label: "Explore",
            title: "Start a New Journey",
            description: "Move from your personal history into a curated cinema path.",
            href: "/explore",
            level: "primary",
          },
          {
            label: "Encyclopedia",
            title: "Browse Movies",
            description: "Open another film and connect it to directors, countries, and movements.",
            href: "/encyclopedia/movies",
          },
          {
            label: "Activity",
            title: "Review Your Timeline",
            description: "Return to your recent activity before choosing the next path.",
            href: "/my/activity",
            level: "deep",
          },
        ]}
      />
    </MyAtlasLayout>
  );
}

function CollectionPlaceholder({ title }: { title: string }) {
  return (
    <AtlasCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Collection
      </p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        This shelf will become available in a later My Atlas sprint.
      </p>
    </AtlasCard>
  );
}

import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import InsightCard from "@/components/insights/InsightCard";
import InsightGrid from "@/components/insights/InsightGrid";
import CollectionGrid from "@/components/collections/CollectionGrid";
import JournalPreview from "@/components/journal/JournalPreview";
import MyActivityPreview from "@/components/my-atlas/MyActivityPreview";
import { buildActivityItems } from "@/components/my-atlas/activity";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import { collections } from "@/data/collections";
import {
  achievements,
  challenges,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { buildMyInsights } from "@/lib/insights";
import { buildPassportModel } from "@/lib/passport";
import { buildCollectionViews } from "@/lib/collections";
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
  const collectionViews = buildCollectionViews({
    collections,
    movies,
    userMovies,
    journalEntries,
  });
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
  });
  const topCountry = insights.countryDistribution[0];
  const topDirector = insights.directorDistribution[0];
  const pinnedCollections = collectionViews
    .filter((view) => view.collection.pinned)
    .slice(0, 4);

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
        <MyActivityPreview items={activityItems} journalEntries={journalEntries} limit={8} />
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
        title="Passport"
        description="A small preview of your wider exploration system."
        action={
          <AtlasButton href="/passport" variant="secondary">
            View Passport
          </AtlasButton>
        }
        className="p-4 md:p-5"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <PassportPreviewCard
            label="Active Challenges"
            value={`${passport.activeChallenges.length}`}
            note="Selected goals in progress."
          />
          <PassportPreviewCard
            label="Latest Achievement"
            value={
              passport.latestAchievements[0]?.achievement.title ?? "None yet"
            }
            note={
              passport.latestAchievements[0]?.unlockedAt
                ? `Unlocked ${passport.latestAchievements[0].unlockedAt}`
                : "Complete a challenge to unlock one."
            }
          />
          <PassportPreviewCard
            label="Overall Progress"
            value={`${getOverallPassportProgress(passport.explorationProgress)}%`}
            note="A broad reading of explored entities."
          />
        </div>
      </Section>

      <Section
        title="My Collection"
        description="Pinned collections from your personal cinema curation."
        action={
          <AtlasButton href="/my/collections" variant="secondary">
            View All
          </AtlasButton>
        }
        className="p-4 md:p-5"
      >
        <CollectionGrid views={pinnedCollections} compact />
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

function PassportPreviewCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <AtlasCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <h3 className="mt-3 line-clamp-1 text-xl font-semibold text-white">
        {value}
      </h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{note}</p>
    </AtlasCard>
  );
}

function getOverallPassportProgress(
  progressItems: Array<{ percentage: number }>
) {
  if (progressItems.length === 0) return 0;

  const total = progressItems.reduce(
    (sum, progress) => sum + progress.percentage,
    0
  );

  return Math.round(total / progressItems.length);
}

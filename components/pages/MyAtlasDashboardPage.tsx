import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
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
  const movieById = new Map(movies.map((movie) => [movie.id, movie]));
  const completedUserMovies = userMovies.filter(
    (item) => item.watchStatus === "completed"
  );
  const inProgressUserMovies = userMovies.filter((item) =>
    ["watching", "rewatching", "paused"].includes(item.watchStatus ?? "")
  );
  const recentlyWatched = [...completedUserMovies]
    .sort((a, b) => (b.watchedDate ?? "").localeCompare(a.watchedDate ?? ""))
    .slice(0, 3);
  const ratedUserMovies = userMovies
    .filter((item) => (item.myRating ?? 0) > 0)
    .slice(0, 3);
  const recentJournals = [...journalEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const watchedMovies = completedUserMovies
    .map((item) => movieById.get(item.movieId))
    .filter((movie): movie is Movie => Boolean(movie));
  const countriesExplored = new Set(
    watchedMovies.map((movie) => movie.countryIds?.[0] ?? movie.countrySlug)
  ).size;
  const directorsExplored = new Set(
    watchedMovies.map((movie) => movie.directorIds?.[0] ?? movie.directorSlug)
  ).size;
  const ratingValues = userMovies
    .map((item) => item.myRating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);
  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) /
        ratingValues.length
      : undefined;

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
        title="Continue Watching"
        description="Resume the films and viewing paths already in progress."
        className="p-4 md:p-5"
      >
        {inProgressUserMovies.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {inProgressUserMovies.slice(0, 3).map((item) => (
              <UserMovieCard key={item.movieId} item={item} movie={movieById.get(item.movieId)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No films in progress."
            description="Start a film journey and it will appear here."
            actionLabel="Browse Movies"
            actionHref="/encyclopedia/movies"
          />
        )}
      </Section>

      <Section
        title="Recently Watched"
        description="A short trail of where your cinema journey has recently been."
        className="p-4 md:p-5"
      >
        {recentlyWatched.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recentlyWatched.map((item) => (
              <UserMovieCard key={item.movieId} item={item} movie={movieById.get(item.movieId)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No watched films yet."
            description="Completed films will become the memory of your Atlas."
            actionLabel="Start Exploring"
            actionHref="/explore"
          />
        )}
      </Section>

      <Section
        title="My Ratings"
        description="Your personal ratings will live here once My Atlas recording is active."
        className="p-4 md:p-5"
      >
        {ratedUserMovies.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {ratedUserMovies.map((item) => (
              <UserMovieCard key={item.movieId} item={item} movie={movieById.get(item.movieId)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No ratings yet."
            description="Rate a film later to begin shaping your personal cinema map."
            actionLabel="Browse Movies"
            actionHref="/encyclopedia/movies"
          />
        )}
      </Section>

      <Section
        title="Journal Preview"
        description="Recent reflections from your personal cinema journal."
        className="p-4 md:p-5"
      >
        {recentJournals.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {recentJournals.map((entry) => (
              <JournalPreviewCard
                key={entry.id}
                entry={entry}
                movie={movieById.get(entry.movieId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            preset="journal"
            title="No journal yet."
            description="Write your first journal after watching a film."
          />
        )}
      </Section>

      <Section
        title="Passport Progress"
        description="A gentle placeholder for future exploration progress."
        className="p-4 md:p-5"
      >
        <EmptyState
          preset="passport"
          title="Passport progress will appear here."
          description="Future progress will connect your watched films to countries, directors, movements, actors, and awards."
        />
      </Section>

      <Section
        title="My Statistics"
        description="A compact snapshot of your current sample data."
        className="p-4 md:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticCard label="Movies Watched" value={`${watchedMovies.length}`} />
          <StatisticCard label="Countries" value={`${countriesExplored}`} />
          <StatisticCard label="Directors" value={`${directorsExplored}`} />
          <StatisticCard
            label="Average Rating"
            value={averageRating ? averageRating.toFixed(1) : "Not rated"}
          />
        </div>
      </Section>

      <EntityContinueJourneyPattern
        title="Continue Exploring"
        description="Use your personal trail as the next path back into cinema."
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
            label: "Journal",
            title: "Prepare a Reflection",
            description: "Journal writing will become the memory layer of My Atlas.",
            href: "/my",
            level: "deep",
          },
        ]}
      />
    </MyAtlasLayout>
  );
}

function UserMovieCard({
  item,
  movie,
}: {
  item: UserMovie;
  movie?: Movie;
}) {
  const title = movie?.title ?? item.movieId;

  return (
    <AtlasCard href={movie ? `/movies/${movie.id}` : undefined} className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {item.watchStatus ?? "Saved"}
      </p>
      <h3 className="mt-3 line-clamp-1 text-lg font-semibold text-white">
        {title}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">
        {item.watchedDate ?? "Not dated"}
      </p>
      <p className="mt-3 line-clamp-1 text-sm text-neutral-400">
        {(item.personalTags ?? []).join(" / ") || "Personal record"}
      </p>
    </AtlasCard>
  );
}

function JournalPreviewCard({
  entry,
  movie,
}: {
  entry: JournalEntry;
  movie?: Movie;
}) {
  return (
    <AtlasCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Journal
        </p>
        <p className="text-xs text-neutral-500">{entry.date}</p>
      </div>

      <h3 className="mt-3 line-clamp-1 text-lg font-semibold text-white">
        {entry.title ?? movie?.title ?? "Untitled reflection"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">
        {movie?.title ?? entry.movieId}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-400">
        {entry.body}
      </p>
    </AtlasCard>
  );
}

function StatisticCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

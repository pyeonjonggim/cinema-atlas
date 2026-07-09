import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import ActivityTimeline from "@/components/my-atlas/ActivityTimeline";
import { buildActivityItems } from "@/components/my-atlas/activity";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyAtlasActivityPageProps = {
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export default function MyAtlasActivityPage({
  movies,
  userMovies,
  journalEntries,
}: MyAtlasActivityPageProps) {
  const activityItems = buildActivityItems({ movies, userMovies });

  return (
    <MyAtlasLayout>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          My Atlas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          Activity
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
          Your cinema timeline, grouped by month and day.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <ActivityTimeline items={activityItems} journalEntries={journalEntries} />
      </section>
    </MyAtlasLayout>
  );
}

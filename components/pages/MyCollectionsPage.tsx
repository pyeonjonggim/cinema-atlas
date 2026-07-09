import CollectionGrid from "@/components/collections/CollectionGrid";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasButton from "@/components/ui/AtlasButton";
import { buildCollectionViews } from "@/lib/collections";
import type { Collection } from "@/types/collection";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyCollectionsPageProps = {
  collections: Collection[];
  movies: Movie[];
  userMovies: UserMovie[];
  journalEntries: JournalEntry[];
};

export default function MyCollectionsPage({
  collections,
  movies,
  userMovies,
  journalEntries,
}: MyCollectionsPageProps) {
  const collectionViews = buildCollectionViews({
    collections,
    movies,
    userMovies,
    journalEntries,
  });
  const pinnedCollections = collectionViews.filter((view) => view.collection.pinned);
  const systemCollections = collectionViews.filter(
    (view) => view.collection.kind === "system"
  );
  const smartCollections = collectionViews.filter(
    (view) => view.collection.kind === "smart"
  );
  const myCollections = collectionViews.filter(
    (view) => view.collection.kind === "user"
  );

  return (
    <MyAtlasLayout>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          My Atlas
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          My Collection
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
          Curate the films that belong together in your own cinema world.
        </p>
      </section>

      <Section
        title="Pinned Collections"
        description="Collections selected for quick access from My Atlas."
        className="p-4 md:p-5"
      >
        <CollectionGrid views={pinnedCollections} />
      </Section>

      <Section
        title="System Collections"
        description="Automatically managed collections such as Watchlist and Favorites."
        className="p-4 md:p-5"
      >
        <CollectionGrid views={systemCollections} />
      </Section>

      <Section
        title="Smart Collections"
        description="Collections calculated from your current movie and journal data."
        className="p-4 md:p-5"
      >
        <CollectionGrid views={smartCollections} />
      </Section>

      <Section
        title="My Collections"
        description="Personal collections that explain why these films belong together."
        className="p-4 md:p-5"
      >
        <CollectionGrid views={myCollections} />
      </Section>

      <Section
        title="Create Collection"
        description="Collection creation will become editable in a future sprint."
        action={<AtlasButton disabled variant="secondary">Create Collection</AtlasButton>}
        className="p-4 md:p-5"
      >
        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-neutral-400">
          Future collections will let you explain the relationship between
          films, not just store them together.
        </p>
      </Section>

      <EntityContinueJourneyPattern
        title="Continue Exploring"
        description="Collections should always point back toward the larger cinematic map."
        items={[
          {
            label: "Movies",
            title: "Browse Movies",
            description: "Find another film that belongs in your personal map.",
            href: "/encyclopedia/movies",
            level: "primary",
          },
          {
            label: "Explore",
            title: "Start a Curated Journey",
            description: "Move from your collections into Cinema Atlas journeys.",
            href: "/explore",
          },
          {
            label: "Journal",
            title: "Return to Journal",
            description: "Reconnect your collections with personal memories.",
            href: "/my/journal",
            level: "deep",
          },
        ]}
      />
    </MyAtlasLayout>
  );
}

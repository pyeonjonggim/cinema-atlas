import Link from "next/link";

import CollectionCover from "@/components/collections/CollectionCover";
import CollectionStatistics from "@/components/collections/CollectionStatistics";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import type { CollectionView } from "@/lib/collections";

type MyCollectionDetailPageProps = {
  view: CollectionView;
};

export default function MyCollectionDetailPage({
  view,
}: MyCollectionDetailPageProps) {
  const primaryMovie = view.movies[0];

  return (
    <MyAtlasLayout>
      <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[220px_1fr] md:p-6">
        <CollectionCover movies={view.movies} />
        <div className="self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {view.collection.kind} Collection
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            {view.collection.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400 md:text-base">
            {view.collection.description}
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            {view.stats.movieCount} Movies
          </p>
        </div>
      </section>

      <Section title="Description" className="p-4 md:p-5">
        <p className="max-w-3xl text-sm leading-7 text-neutral-300">
          {view.collection.description}
        </p>
      </Section>

      <Section title="Movies" className="p-4 md:p-5">
        {view.movies.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {view.movies.map((movie) => (
              <AtlasCard
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Movie
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {movie.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {movie.year} / {movie.country}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
                  {movie.director}
                </p>
              </AtlasCard>
            ))}
          </div>
        ) : (
          <EmptyState
            preset="collection"
            title="This collection is empty."
            description="Its structure is ready for future films."
          />
        )}
      </Section>

      <Section title="Statistics" className="p-4 md:p-5">
        <CollectionStatistics stats={view.stats} />
      </Section>

      <EntityContinueJourneyPattern
        title="Continue Exploring"
        description="Use this collection as a doorway back into Cinema Atlas."
        items={[
          {
            label: "Collection",
            title: "Back to My Collection",
            description: "Return to your personal curation space.",
            href: "/my/collections",
            level: "primary",
          },
          {
            label: "Movie",
            title: primaryMovie ? primaryMovie.title : "Browse Movies",
            description: primaryMovie
              ? "Open one film and continue through its relationships."
              : "Find a film to begin this collection path.",
            href: primaryMovie ? `/movies/${primaryMovie.id}` : "/encyclopedia/movies",
          },
          {
            label: "Encyclopedia",
            title: primaryMovie ? `${primaryMovie.country} Cinema` : "Browse Countries",
            description: "Move from a personal collection into connected knowledge.",
            href: primaryMovie
              ? `/encyclopedia/countries/${primaryMovie.countrySlug}`
              : "/encyclopedia/countries",
            level: "deep",
          },
        ]}
      />

      <div>
        <Link href="/my/collections" className="text-sm text-neutral-400 hover:text-white">
          Back to My Collection
        </Link>
      </div>
    </MyAtlasLayout>
  );
}

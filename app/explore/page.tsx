import Link from "next/link";
import {
  exploreCategories,
  exploreRoutes,
  type ExploreRoute,
  type ExploreStepType,
} from "@/data/exploreRoutes";

const stepTypeLabel: Record<ExploreStepType, string> = {
  movie: "Movie",
  director: "Director",
  country: "Country",
  movement: "Movement",
  actor: "Actor",
  award: "Award",
};

const stepTypeHrefBase: Record<ExploreStepType, string> = {
  movie: "/movies",
  director: "/encyclopedia/directors",
  country: "/encyclopedia/countries",
  movement: "/encyclopedia/movements",
  actor: "/encyclopedia/actors",
  award: "/encyclopedia/awards",
};

const categoryDescriptions: Record<ExploreRoute["category"], string> = {
  "Director Journey":
    "Follow a filmmaker into films, actors, countries, and styles.",
  "Country Journey":
    "Start from a national cinema and move into its films and directors.",
  "Movement Journey":
    "Explore film history through periods, forms, and shared ideas.",
  "Actor Journey": "Move through screen images, roles, directors, and films.",
  "Award Journey": "Follow recognition systems into awarded films and filmmakers.",
  "Hidden Gems": "Discover less obvious routes across world cinema.",
  "Deep Dive": "Longer study paths for serious film history exploration.",
};

function getStepHref(type: ExploreStepType, slug: string) {
  return `${stepTypeHrefBase[type]}/${slug}`;
}

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Cinema Atlas
          </p>

          <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">
            Atlas Explore
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-300">
            Where will your next film journey begin?
          </p>

          <p className="mt-4 max-w-3xl leading-7 text-neutral-400">
            Atlas Explore is not a search page. It is a curated map of cinema
            paths: from movies to directors, from countries to movements, from
            actors to awards, and back again.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/movies"
              className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Browse Movies
            </Link>

            <Link
              href="/encyclopedia"
              className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              Open encyclopedia
            </Link>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Journey Categories
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              Choose a way into cinema
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {exploreCategories.map((category) => (
              <div
                key={category}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="font-semibold text-white">{category}</p>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  {categoryDescriptions[category]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Featured Journeys
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              Start with a curated journey
            </h2>

            <p className="mt-3 max-w-3xl text-neutral-400">
              These journeys are manually curated for v0. Later, Cinema Atlas can
              generate routes from your ratings, journal, interests, and watch
              history.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {exploreRoutes.map((route) => (
              <article
                key={route.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <Link href={`/explore/${route.id}`} className="block">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        {route.category}
                      </p>

                      <h3 className="mt-3 text-2xl font-bold text-white">
                        {route.title}
                      </h3>

                      <p className="mt-2 text-sm text-neutral-400">
                        {route.subtitle}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
                        {route.difficulty}
                      </span>

                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
                        {route.steps.length} stops
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-neutral-400">
                    {route.description}
                  </p>

                  <p className="mt-5 inline-block rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
                    Open Journey →
                  </p>
                </Link>

                <div className="mt-5 space-y-3">
                  {route.steps.slice(0, 4).map((step, index) => (
                    <div
                      key={`${route.id}-${step.type}-${step.slug}`}
                      className="flex gap-3"
                    >
                      <div className="flex w-8 shrink-0 flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs text-neutral-400">
                          {index + 1}
                        </div>

                        {index < Math.min(route.steps.length, 4) - 1 && (
                          <div className="h-full min-h-4 w-px bg-white/10" />
                        )}
                      </div>

                      <Link
                        href={getStepHref(step.type, step.slug)}
                        className="group flex-1 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                              {stepTypeLabel[step.type]}
                            </p>

                            <p className="mt-1 font-semibold text-white group-hover:underline">
                              {step.label}
                            </p>

                            {step.labelKo && (
                              <p className="mt-1 text-sm text-neutral-500">
                                {step.labelKo}
                              </p>
                            )}
                          </div>

                          <span className="text-sm text-neutral-500">
                            Explore →
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}

                  {route.steps.length > 4 && (
                    <p className="pl-11 text-sm text-neutral-500">
                      + {route.steps.length - 4} more stop
                      {route.steps.length - 4 === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
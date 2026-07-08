import Link from "next/link";
import { notFound } from "next/navigation";

import {
  exploreRoutes,
  type ExploreStepType,
} from "@/data/exploreRoutes";
import { movies } from "@/data/movies";

type ExploreRouteDetailPageProps = {
  params: Promise<{
    routeId: string;
  }>;
};

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

function getStepHref(type: ExploreStepType, slug: string) {
  return `${stepTypeHrefBase[type]}/${slug}`;
}

function formatRuntime(totalMinutes: number) {
  if (totalMinutes <= 0) return "0m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

export default async function ExploreRouteDetailPage({
  params,
}: ExploreRouteDetailPageProps) {
  const { routeId } = await params;

  const route = exploreRoutes.find((item) => item.id === routeId);

  if (!route) {
    notFound();
  }

  const routeMovies = route.steps
    .filter((step) => step.type === "movie")
    .map((step) => movies.find((movie) => movie.id === step.slug))
    .filter((movie): movie is (typeof movies)[number] => Boolean(movie));

  const totalRuntime = routeMovies.reduce(
    (sum, movie) => sum + movie.runtime,
    0
  );

  const progressCurrent = 0;
  const progressTotal = route.steps.length;
  const progressPercent =
    progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;

  const nextRoutes = exploreRoutes.filter((item) =>
    route.nextRouteIds?.includes(item.id)
  );

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/explore"
          className="text-sm text-neutral-500 transition hover:text-white"
        >
          ← Back to Explore
        </Link>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Atlas Journey
          </p>

          <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">
            {route.title}
          </h1>

          <p className="mt-4 text-lg text-neutral-300">{route.subtitle}</p>

          <p className="mt-5 max-w-3xl leading-7 text-neutral-400">
            {route.description}
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              Journey Goal
            </p>

            <p className="mt-2 text-lg font-medium text-white">{route.goal}</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300">
              {route.category}
            </span>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300">
              {route.difficulty}
            </span>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300">
              {route.steps.length} Stops
            </span>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300">
              {routeMovies.length} {routeMovies.length === 1 ? "Film" : "Films"}
            </span>

            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300">
              {formatRuntime(totalRuntime)}
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                Journey Progress
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                {progressCurrent} / {progressTotal} Stops
              </h2>
            </div>

            <p className="text-sm text-neutral-500">
              Progress will connect to Collection / Journal later.
            </p>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-neutral-200 transition"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
              Journey Steps
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              Follow this journey
            </h2>

            <p className="mt-3 max-w-3xl text-neutral-400">
              각 Step은 기존 Cinema Atlas 상세 페이지로 연결됩니다. 순서대로
              따라가도 되고, 관심 있는 지점부터 바로 탐험해도 됩니다.
            </p>
          </div>

          <div className="relative space-y-4 border-l border-white/10 pl-6">
            {route.steps.map((step, index) => (
              <div
                key={`${route.id}-${step.type}-${step.slug}`}
                className="relative"
              >
                <div className="absolute -left-[31px] top-5 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-neutral-950 text-[10px] text-neutral-400">
                  {index + 1}
                </div>

                <Link
                  href={getStepHref(step.type, step.slug)}
                  className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        {stepTypeLabel[step.type]}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-white group-hover:underline">
                        {step.label}
                      </h3>

                      {step.labelKo && (
                        <p className="mt-1 text-neutral-500">
                          {step.labelKo}
                        </p>
                      )}
                    </div>

                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-400">
                      Open →
                    </span>
                  </div>

                  {step.description && (
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-400">
                      {step.description}
                    </p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            Journey Complete
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Complete this Journey
          </h2>

          <p className="mt-3 max-w-3xl text-neutral-400">
            Unlock more Routes in the future. Later, this can connect to
            Challenge, Collection, and Journal.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-neutral-500"
          >
            Completion coming later
          </button>
        </section>

        {nextRoutes.length > 0 && (
          <section className="mt-10">
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
                Continue Exploring
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                What&apos;s Next?
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {nextRoutes.map((nextRoute) => (
                <Link
                  key={nextRoute.id}
                  href={`/explore/${nextRoute.id}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {nextRoute.category}
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-white">
                    {nextRoute.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {nextRoute.subtitle}
                  </p>

                  <p className="mt-4 text-sm font-medium text-neutral-300">
                    Continue Journey →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Back to Explore
          </Link>

          <Link
            href={getStepHref(route.steps[0].type, route.steps[0].slug)}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            Start First Stop →
          </Link>
        </div>
      </section>
    </main>
  );
}
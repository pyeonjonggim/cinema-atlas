import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { actors } from "@/data/actors";
import { movies } from "@/data/movies";
import { directors } from "@/data/directors";
import { countries } from "@/data/countries";

import FilmographyTimeline from "@/components/FilmographyTimeline";
import FrequentDirectors from "@/components/FrequentDirectors";
import ContinueJourney from "@/components/ContinueJourney";

type ActorDetailPageProps = {
  params: Promise<{
    actor: string;
  }>;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default async function ActorDetailPage({ params }: ActorDetailPageProps) {
  const { actor: actorSlug } = await params;

  const actor = actors.find((item) => item.slug === actorSlug);

  if (!actor) {
    notFound();
  }

  const actorCountry = countries.find(
    (country) => country.slug === actor.countrySlug
  );

  const actorMovies = movies.filter((movie) =>
    movie.actorSlugs.includes(actor.slug)
  );

  const essentialFilms = movies.filter((movie) =>
    actor.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find((movie) => movie.id === actor.starterMovieId);

  const careerTimelineMovies = [...actorMovies]
    .sort((a, b) => a.year - b.year)
    .map((movie) => ({
      id: movie.id,
      year: movie.year,
      title: movie.title,
      originalTitle: movie.originalTitle,
      poster: movie.poster,
    }));

  const directorCountMap = new Map<
    string,
    {
      slug: string;
      name: string;
      nameKo: string;
      count: number;
    }
  >();

  actorMovies.forEach((movie) => {
    const director = directors.find((item) => item.slug === movie.directorSlug);

    if (!director) return;

    const existing = directorCountMap.get(director.slug);

    if (existing) {
      directorCountMap.set(director.slug, {
        ...existing,
        count: existing.count + 1,
      });
    } else {
      directorCountMap.set(director.slug, {
        slug: director.slug,
        name: director.name,
        nameKo: director.nameKo,
        count: 1,
      });
    }
  });

  const frequentDirectors = Array.from(directorCountMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );

  const mainDirector = frequentDirectors[0];
  const mainMovie = starterMovie ?? actorMovies[0];
  const mainMovementSlug = mainMovie?.movementSlug;
  const mainMovement = mainMovie?.movement;

  const journeyItems = [
    {
      label: "Films",
      title: `Explore ${actor.name}'s Films`,
      description: "Browse films connected to this actor.",
      href: `/movies?actor=${actor.slug}`,
    },
    {
      label: "Director",
      title: mainDirector
        ? `Explore ${mainDirector.name}`
        : "Explore Frequent Directors",
      description: mainDirector
        ? "Move from this actor to a director they worked with."
        : "Director connection is not available yet.",
      href: mainDirector
        ? `/encyclopedia/directors/${mainDirector.slug}`
        : "/encyclopedia/directors",
      disabled: !mainDirector,
    },
    {
      label: "Country",
      title: actorCountry
        ? `Explore ${actorCountry.name} Cinema`
        : "Explore Country",
      description: actorCountry
        ? "Connect this actor to a wider national cinema context."
        : "Country connection is not available yet.",
      href: actorCountry
        ? `/encyclopedia/countries/${actorCountry.slug}`
        : "/encyclopedia/countries",
      disabled: !actorCountry,
    },
    {
      label: "Movement",
      title: mainMovement ?? "Explore Movement",
      description: mainMovement
        ? "Continue through the film movement connected to this actor."
        : "Movement connection is not available yet.",
      href: mainMovementSlug
        ? `/encyclopedia/movements/${mainMovementSlug}`
        : "/encyclopedia/movements",
      disabled: !mainMovementSlug,
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative film from this actor."
        : "Starting point is not selected yet.",
      href: starterMovie ? `/movies/${starterMovie.id}` : "/movies",
      disabled: !starterMovie,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-10">
          <p className="mb-3 text-sm text-neutral-400">Actor Encyclopedia</p>

          <h1 className="text-3xl font-bold text-white">{actor.name}</h1>

          <p className="mt-1 text-lg text-neutral-400">{actor.nameKo}</p>

          <div className="mt-6 space-y-4 text-sm text-neutral-300">
            <div>
              <p className="text-neutral-500">Country</p>
              {actorCountry ? (
                <Link
                  href={`/encyclopedia/countries/${actorCountry.slug}`}
                  className="mt-1 inline-block hover:text-white"
                >
                  {actorCountry.flag} {actorCountry.name}
                </Link>
              ) : (
                <p className="mt-1">Not selected</p>
              )}
            </div>

            <div>
              <p className="text-neutral-500">Years</p>
              <p className="mt-1">
                {actor.birthYear}
                {actor.deathYear ? `–${actor.deathYear}` : "–"}
              </p>
            </div>

            <div>
              <p className="text-neutral-500">Starter Film</p>
              <p className="mt-1">{starterMovie?.title ?? "Not selected"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {actor.screenPersona.slice(0, 4).map((persona) => (
              <span
                key={persona}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300"
              >
                {persona}
              </span>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <Section title="Actor Profile">
            <p className="leading-7 text-neutral-300">{actor.description}</p>
          </Section>

          <Section title="Quick Facts">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Country</p>
                <p className="mt-1 text-white">
                  {actorCountry
                    ? `${actorCountry.flag} ${actorCountry.name}`
                    : "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Birth</p>
                <p className="mt-1 text-white">{actor.birthYear}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Starter Film</p>
                <p className="mt-1 text-white">
                  {starterMovie?.title ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Screen Image</p>
                <p className="mt-1 text-white">
                  {actor.screenPersona[0] ?? "Not selected"}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Why This Actor Matters">
            <p className="leading-7 text-neutral-300">{actor.whyMatters}</p>
          </Section>

          <Section title="Screen Persona">
            <ul className="space-y-3">
              {actor.screenPersona.map((persona) => (
                <li key={persona} className="leading-7 text-neutral-300">
                  <span className="mr-2 text-neutral-500">•</span>
                  {persona}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Key Roles">
            <div className="flex flex-wrap gap-2">
              {actor.keyRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm text-neutral-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Essential Films">
            {essentialFilms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {essentialFilms.map((movie) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-lg font-semibold text-white">
                      {movie.title}
                    </p>

                    <p className="text-sm text-neutral-500">
                      {movie.originalTitle} · {movie.year}
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-300">
                      {movie.memo}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">
                Essential films are not selected yet.
              </p>
            )}
          </Section>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <FilmographyTimeline
              title="Career Timeline"
              items={careerTimelineMovies}
              emptyMessage="No films from this actor have been added yet."
            />

            <FrequentDirectors items={frequentDirectors} />
          </div>

          <Section title="Recommended Starting Point">
            {starterMovie ? (
              <Link
                href={`/movies/${starterMovie.id}`}
                className="block rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 transition hover:bg-amber-400/15"
              >
                <p className="text-sm text-amber-300">Start Here</p>

                <h3 className="mt-1 text-2xl font-bold text-white">
                  {starterMovie.title}
                </h3>

                <p className="mt-2 text-sm text-neutral-300">
                  {starterMovie.originalTitle} · {starterMovie.year} ·{" "}
                  {starterMovie.country} · {starterMovie.runtime} min
                </p>

                <p className="mt-4 leading-7 text-neutral-300">
                  {actor.startingPointReason}
                </p>
              </Link>
            ) : (
              <p className="text-neutral-400">
                Recommended starting point has not been selected yet.
              </p>
            )}
          </Section>

          <ContinueJourney
            subtitle="이 배우에서 출발해 영화, 감독, 국가, 영화사조로 탐험을 이어가세요."
            items={journeyItems}
          />
        </div>
      </div>
    </main>
  );
}
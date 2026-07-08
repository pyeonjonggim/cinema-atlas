import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { movements } from "@/data/movements";
import { movies } from "@/data/movies";
import { directors } from "@/data/directors";
import { countries } from "@/data/countries";

import FilmographyTimeline from "@/components/FilmographyTimeline";
import RepresentativeDirectors from "@/components/RepresentativeDirectors";
import RelatedCountries from "@/components/RelatedCountries";
import ContinueJourney from "@/components/ContinueJourney";

type MovementDetailPageProps = {
  params: Promise<{
    movement: string;
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

export default async function MovementDetailPage({
  params,
}: MovementDetailPageProps) {
  const { movement: movementSlug } = await params;

  const movement = movements.find((item) => item.slug === movementSlug);

  if (!movement) {
    notFound();
  }

  const movementMovies = movies.filter(
    (movie) => movie.movementSlug === movement.slug
  );

  const essentialFilms = movies.filter((movie) =>
    movement.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === movement.starterMovieId
  );

  const timelineMovies = [...movementMovies]
    .sort((a, b) => a.year - b.year)
    .map((movie) => ({
      id: movie.id,
      year: movie.year,
      title: movie.title,
      originalTitle: movie.originalTitle,
      poster: movie.poster,
    }));

  const representativeDirectors = directors
    .filter((director) => movement.directorSlugs.includes(director.slug))
    .map((director) => ({
      slug: director.slug,
      name: director.name,
      nameKo: director.nameKo,
      description: director.description,
    }));

  const relatedCountries = countries
    .filter((country) => movement.countrySlugs.includes(country.slug))
    .map((country) => ({
      slug: country.slug,
      name: country.name,
      nameKo: country.nameKo,
      flag: country.flag,
      region: country.region,
      description: country.description,
    }));

  const mainCountry = relatedCountries[0];
  const mainDirector = representativeDirectors[0];

  const journeyItems = [
    {
      label: "Films",
      title: `Explore ${movement.name} Films`,
      description: "Browse films connected to this film movement.",
      href: `/movies?movement=${movement.slug}`,
    },
    {
      label: "Country",
      title: mainCountry
        ? `Explore ${mainCountry.name} Cinema`
        : "Explore Related Country",
      description: mainCountry
        ? "Move from this movement to its national cinema context."
        : "Country connection is not available yet.",
      href: mainCountry
        ? `/encyclopedia/countries/${mainCountry.slug}`
        : "/encyclopedia/countries",
      disabled: !mainCountry,
    },
    {
      label: "Director",
      title: mainDirector
        ? `Explore ${mainDirector.name}`
        : "Explore Representative Directors",
      description: mainDirector
        ? "Continue through a key filmmaker connected to this movement."
        : "Representative director data is not available yet.",
      href: mainDirector
        ? `/encyclopedia/directors/${mainDirector.slug}`
        : "/encyclopedia/directors",
      disabled: !mainDirector,
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative film from this movement."
        : "Starting point is not selected yet.",
      href: starterMovie ? `/movies/${starterMovie.id}` : "/movies",
      disabled: !starterMovie,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-10">
          <p className="mb-3 text-sm text-neutral-400">
            Movement Encyclopedia
          </p>

          <h1 className="text-3xl font-bold text-white">{movement.name}</h1>

          <p className="mt-1 text-lg text-neutral-400">{movement.nameKo}</p>

          <div className="mt-6 space-y-4 text-sm text-neutral-300">
            <div>
              <p className="text-neutral-500">Period</p>
              <p className="mt-1">{movement.period}</p>
            </div>

            <div>
              <p className="text-neutral-500">Main Country</p>
              <p className="mt-1">
                {mainCountry
                  ? `${mainCountry.flag} ${mainCountry.name}`
                  : "Not selected"}
              </p>
            </div>

            <div>
              <p className="text-neutral-500">Starter Film</p>
              <p className="mt-1">{starterMovie?.title ?? "Not selected"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {movement.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <Section title="Movement Profile">
            <p className="leading-7 text-neutral-300">
              {movement.description}
            </p>
          </Section>

          <Section title="Quick Facts">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Period</p>
                <p className="mt-1 text-white">{movement.period}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Main Country</p>
                <p className="mt-1 text-white">
                  {mainCountry
                    ? `${mainCountry.flag} ${mainCountry.name}`
                    : "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Starter Film</p>
                <p className="mt-1 text-white">
                  {starterMovie?.title ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Core Theme</p>
                <p className="mt-1 text-white">
                  {movement.themes[0] ?? "Not selected"}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Why This Movement Matters">
            <p className="leading-7 text-neutral-300">
              {movement.whyMatters}
            </p>
          </Section>

          <Section title="Movement Overview">
            <ul className="space-y-3">
              {movement.characteristics.map((item) => (
                <li key={item} className="leading-7 text-neutral-300">
                  <span className="mr-2 text-neutral-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
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

          <FilmographyTimeline
            title="Movement Timeline"
            items={timelineMovies}
            emptyMessage="No films from this movement have been added yet."
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <RepresentativeDirectors items={representativeDirectors} />
            <RelatedCountries items={relatedCountries} />
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
                  {movement.startingPointReason}
                </p>
              </Link>
            ) : (
              <p className="text-neutral-400">
                Recommended starting point has not been selected yet.
              </p>
            )}
          </Section>

          <ContinueJourney
            subtitle="이 영화사조에서 출발해 작품, 국가, 감독, 대표작으로 탐험을 이어가세요."
            items={journeyItems}
          />
        </div>
      </div>
    </main>
  );
}
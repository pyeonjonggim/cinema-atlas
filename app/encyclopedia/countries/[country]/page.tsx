import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { countries } from "@/data/countries";
import { movies } from "@/data/movies";
import { directors } from "@/data/directors";

import FilmographyTimeline from "@/components/FilmographyTimeline";
import RepresentativeDirectors from "@/components/RepresentativeDirectors";
import MajorMovements from "@/components/MajorMovements";
import ContinueJourney from "@/components/ContinueJourney";

type CountryDetailPageProps = {
  params: Promise<{
    country: string;
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

export default async function CountryDetailPage({
  params,
}: CountryDetailPageProps) {
  const { country: countrySlug } = await params;

  const country = countries.find((item) => item.slug === countrySlug);

  if (!country) {
    notFound();
  }

  const countryMovies = movies.filter(
    (movie) => movie.countrySlug === country.slug
  );

  const essentialFilms = movies.filter((movie) =>
    country.essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === country.starterMovieId
  );

  const timelineMovies = [...countryMovies]
    .sort((a, b) => a.year - b.year)
    .map((movie) => ({
      id: movie.id,
      year: movie.year,
      title: movie.title,
      originalTitle: movie.originalTitle,
      poster: movie.poster,
    }));

  const representativeDirectors = directors
    .filter((director) => country.directorSlugs.includes(director.slug))
    .map((director) => ({
      slug: director.slug,
      name: director.name,
      nameKo: director.nameKo,
      description: director.description,
    }));

  const movementMap = new Map<string, { slug: string; name: string }>();

  countryMovies.forEach((movie) => {
    if (!movementMap.has(movie.movementSlug)) {
      movementMap.set(movie.movementSlug, {
        slug: movie.movementSlug,
        name: movie.movement,
      });
    }
  });

  const majorMovements = Array.from(movementMap.values()).filter((movement) =>
    country.movementSlugs.includes(movement.slug)
  );

  const journeyItems = [
    {
      label: "Films",
      title: `Explore ${country.name} Films`,
      description: "Browse films connected to this national cinema.",
      href: `/movies?country=${country.slug}`,
    },
    {
      label: "Directors",
      title: `Explore ${country.name} Directors`,
      description: "Move from national cinema to representative filmmakers.",
      href: "/encyclopedia/directors",
    },
    {
      label: "Movements",
      title: "Explore Major Movements",
      description:
        "Continue through the film movements connected to this country.",
      href: majorMovements[0]
        ? `/encyclopedia/movements/${majorMovements[0].slug}`
        : "/encyclopedia/movements",
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative film from this country."
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
            Country Encyclopedia
          </p>

          <h1 className="text-3xl font-bold text-white">
            {country.flag} {country.name}
          </h1>

          <p className="mt-1 text-lg text-neutral-400">{country.nameKo}</p>

          <div className="mt-6 space-y-4 text-sm text-neutral-300">
            <div>
              <p className="text-neutral-500">Region</p>
              <p className="mt-1">{country.region}</p>
            </div>

            <div>
              <p className="text-neutral-500">Representative Era</p>
              <p className="mt-1">{country.representativeEra}</p>
            </div>

            <div>
              <p className="text-neutral-500">Known For</p>
              <p className="mt-1">{country.knownFor}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {country.themes.map((theme) => (
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
          <Section title="Country Profile">
            <p className="leading-7 text-neutral-300">
              {country.description}
            </p>
          </Section>

          <Section title="Quick Facts">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Region</p>
                <p className="mt-1 text-white">{country.region}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Representative Era</p>
                <p className="mt-1 text-white">{country.representativeEra}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Starter Film</p>
                <p className="mt-1 text-white">
                  {starterMovie?.title ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Known For</p>
                <p className="mt-1 text-white">{country.knownFor}</p>
              </div>
            </div>
          </Section>

          <Section title="Why This Country Matters">
            <p className="leading-7 text-neutral-300">{country.whyMatters}</p>
          </Section>

          <Section title="Cinema Overview">
            <ul className="space-y-3">
              {country.characteristics.map((item) => (
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
            title="Film History Timeline"
            items={timelineMovies}
            emptyMessage="No films from this country have been added yet."
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <RepresentativeDirectors items={representativeDirectors} />
            <MajorMovements items={majorMovements} />
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
                  {starterMovie.runtime} min
                </p>

                <p className="mt-4 leading-7 text-neutral-300">
                  {country.startingPointReason}
                </p>
              </Link>
            ) : (
              <p className="text-neutral-400">
                Recommended starting point has not been selected yet.
              </p>
            )}
          </Section>

          <ContinueJourney
            subtitle="이 국가에서 출발해 영화, 감독, 사조, 대표작으로 탐험을 이어가세요."
            items={journeyItems}
          />
        </div>
      </div>
    </main>
  );
}
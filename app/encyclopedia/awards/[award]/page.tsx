import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { awards } from "@/data/awards";
import { movies } from "@/data/movies";
import { directors } from "@/data/directors";
import { countries } from "@/data/countries";

import RepresentativeDirectors from "@/components/RepresentativeDirectors";
import ContinueJourney from "@/components/ContinueJourney";

type AwardDetailPageProps = {
  params: Promise<{
    award: string;
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

function AwardTimeline({
  items,
}: {
  items: {
    year: number;
    title: string;
    description: string;
  }[];
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Award Timeline
        </h2>
        <p className="text-neutral-400">
          Award timeline has not been added yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Award Timeline</h2>

      <div className="relative space-y-6 border-l border-white/10 pl-6">
        {items.map((item) => (
          <div key={`${item.year}-${item.title}`} className="relative">
            <div className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border border-white/20 bg-neutral-950" />

            <p className="mb-2 text-sm font-semibold text-neutral-500">
              {item.year}
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function AwardDetailPage({
  params,
}: AwardDetailPageProps) {
  const { award: awardSlug } = await params;

  const award = awards.find((item) => item.slug === awardSlug);

  if (!award) {
    notFound();
  }

  const awardCountry = countries.find(
    (country) => country.slug === award.countrySlug
  );

  const awardMovies = movies.filter((movie) =>
    movie.awardSlugs.includes(award.slug)
  );

  const representativeWinningFilms = movies.filter((movie) =>
    award.representativeMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find((movie) => movie.id === award.starterMovieId);

  const representativeDirectors = directors
    .filter((director) => award.directorSlugs.includes(director.slug))
    .map((director) => ({
      slug: director.slug,
      name: director.name,
      nameKo: director.nameKo,
      description: director.description,
    }));

  const firstDirector = representativeDirectors[0];
  const firstWinningFilm = representativeWinningFilms[0];
  const firstCountrySlug = firstWinningFilm?.countrySlug;
  const firstMovementSlug = firstWinningFilm?.movementSlug;

  const journeyItems = [
    {
      label: "Winning Films",
      title: `Explore ${award.name} Films`,
      description: "Browse films connected to this award.",
      href: `/movies?award=${award.slug}`,
    },
    {
      label: "Director",
      title: firstDirector
        ? `Explore ${firstDirector.name}`
        : "Explore Representative Directors",
      description: firstDirector
        ? "Move from an awarded film to a recognized filmmaker."
        : "Representative director data is not available yet.",
      href: firstDirector
        ? `/encyclopedia/directors/${firstDirector.slug}`
        : "/encyclopedia/directors",
      disabled: !firstDirector,
    },
    {
      label: "Country",
      title: firstCountrySlug
        ? "Explore Winning Film Country"
        : "Explore Country",
      description: firstCountrySlug
        ? "Follow the country connection through a representative winning film."
        : "Country connection is not available yet.",
      href: firstCountrySlug
        ? `/encyclopedia/countries/${firstCountrySlug}`
        : "/encyclopedia/countries",
      disabled: !firstCountrySlug,
    },
    {
      label: "Movement",
      title: firstMovementSlug
        ? "Explore Winning Film Movement"
        : "Explore Movement",
      description: firstMovementSlug
        ? "Continue through the movement connected to a representative winning film."
        : "Movement connection is not available yet.",
      href: firstMovementSlug
        ? `/encyclopedia/movements/${firstMovementSlug}`
        : "/encyclopedia/movements",
      disabled: !firstMovementSlug,
    },
    {
      label: "Starting Point",
      title: starterMovie ? starterMovie.title : "Recommended Starting Point",
      description: starterMovie
        ? "Start with a representative winning film."
        : "Starting point is not selected yet.",
      href: starterMovie ? `/movies/${starterMovie.id}` : "/movies",
      disabled: !starterMovie,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-10">
          <p className="mb-3 text-sm text-neutral-400">Award Encyclopedia</p>

          <h1 className="text-3xl font-bold text-white">{award.name}</h1>

          <p className="mt-1 text-lg text-neutral-400">{award.nameKo}</p>

          <div className="mt-6 space-y-4 text-sm text-neutral-300">
            <div>
              <p className="text-neutral-500">Organization</p>
              <p className="mt-1">{award.organization}</p>
            </div>

            <div>
              <p className="text-neutral-500">Founded</p>
              <p className="mt-1">{award.foundedYear}</p>
            </div>

            <div>
              <p className="text-neutral-500">Country</p>
              {awardCountry ? (
                <Link
                  href={`/encyclopedia/countries/${awardCountry.slug}`}
                  className="mt-1 inline-block hover:text-white"
                >
                  {awardCountry.flag} {awardCountry.name}
                </Link>
              ) : (
                <p className="mt-1">Not selected</p>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <Section title="Award Profile">
            <p className="leading-7 text-neutral-300">{award.description}</p>
          </Section>

          <Section title="Quick Facts">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Founded</p>
                <p className="mt-1 text-white">{award.foundedYear}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Organization</p>
                <p className="mt-1 text-white">{award.organization}</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Country</p>
                <p className="mt-1 text-white">
                  {awardCountry
                    ? `${awardCountry.flag} ${awardCountry.name}`
                    : "Not selected"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-neutral-500">Starter Film</p>
                <p className="mt-1 text-white">
                  {starterMovie?.title ?? "Not selected"}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Why This Award Matters">
            <p className="leading-7 text-neutral-300">{award.whyMatters}</p>
          </Section>

          <Section title="Award Overview">
            <ul className="space-y-3">
              {award.overview.map((item) => (
                <li key={item} className="leading-7 text-neutral-300">
                  <span className="mr-2 text-neutral-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Representative Winning Films">
            {representativeWinningFilms.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {representativeWinningFilms.map((movie) => (
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
                Representative winning films are not selected yet.
              </p>
            )}
          </Section>

          <AwardTimeline items={award.timeline ?? []} />

          <RepresentativeDirectors items={representativeDirectors} />

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
                  {award.startingPointReason}
                </p>
              </Link>
            ) : (
              <p className="text-neutral-400">
                Recommended starting point has not been selected yet.
              </p>
            )}
          </Section>

          <ContinueJourney
            subtitle="이 상에서 출발해 수상작, 감독, 국가, 영화사조로 탐험을 이어가세요."
            items={journeyItems}
          />
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";
import { notFound } from "next/navigation";

import { directors } from "@/data/directors";
import { movies } from "@/data/movies";
import Section from "@/components/Section";
import InformationGrid, {
  type InformationGridItem,
} from "@/components/InformationGrid";
import FilmographyTimeline from "@/components/FilmographyTimeline";
import FrequentCollaborators from "@/components/FrequentCollaborators";
import ContinueJourney from "@/components/ContinueJourney";
import InfluenceRelatedDirectors from "@/components/InfluenceRelatedDirectors";

type DirectorDetailPageProps = {
  params: Promise<{
    director: string;
  }>;
};

export default async function DirectorDetailPage({
  params,
}: DirectorDetailPageProps) {
  const { director: directorSlug } = await params;

  const director = directors.find((item) => item.slug === directorSlug);

  if (!director) {
    notFound();
  }

  const directorMovies = movies.filter(
    (movie) => movie.directorSlug === director.slug
  );

  const essentialMovieIds = director.essentialMovieIds ?? [];

  const knownForMovies = movies.filter((movie) =>
    director.knownForMovieIds.includes(movie.id)
  );

  const essentialFilms = movies.filter((movie) =>
    essentialMovieIds.includes(movie.id)
  );

  const starterMovie = movies.find(
    (movie) => movie.id === director.starterMovieId
  );

  const quickFacts: InformationGridItem[] = [
    {
      label: "Country",
      value: (
        <Link
          href={`/encyclopedia/countries/${director.countrySlug}`}
          className="hover:text-neutral-300"
        >
          {director.countryFlag} {director.country}
        </Link>
      ),
    },
    {
      label: "Birth",
      value: director.birthYear,
    },
    {
      label: "Starter Film",
      value: starterMovie?.title ?? "Not selected",
    },
    {
      label: "Main Style",
      value: director.styleKeywords[0] ?? "Unknown",
    },
  ];

  const filmographyMovies = [...directorMovies]
    .sort((a, b) => a.year - b.year)
    .map((movie) => ({
      id: movie.id,
      year: movie.year,
      title: movie.title,
      originalTitle: movie.originalTitle,
      poster: movie.poster,
    }));

  const collaboratorMap = new Map<
    string,
    {
      name: string;
      slug: string;
      count: number;
    }
  >();

  directorMovies.forEach((movie) => {
    movie.actorSlugs.forEach((actorSlug, index) => {
      const actorName = movie.actors[index];

      if (!actorName) return;

      const existing = collaboratorMap.get(actorSlug);

      if (existing) {
        collaboratorMap.set(actorSlug, {
          ...existing,
          count: existing.count + 1,
        });
      } else {
        collaboratorMap.set(actorSlug, {
          name: actorName,
          slug: actorSlug,
          count: 1,
        });
      }
    });
  });

  const frequentCollaborators = Array.from(collaboratorMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );

  const mainMovement = directorMovies[0]?.movement;
  const mainMovementSlug = directorMovies[0]?.movementSlug;
  const topCollaborator = frequentCollaborators[0];

  const journeyItems = [
    {
      label: "Films",
      title: `Explore Films by ${director.name}`,
      description: `${directorMovies.length} film${
        directorMovies.length === 1 ? "" : "s"
      } connected to this director.`,
      href: `/movies?director=${director.slug}`,
    },
    {
      label: "Country",
      title: `Explore ${director.country} Cinema`,
      description: "Move from one director to a wider national cinema context.",
      href: `/encyclopedia/countries/${director.countrySlug}`,
    },
    {
      label: "Movement",
      title: mainMovement ?? "Explore Movement",
      description: mainMovement
        ? "Continue through the film movement connected to this director."
        : "Movement connection is not available yet.",
      href: mainMovementSlug
        ? `/encyclopedia/movements/${mainMovementSlug}`
        : "/encyclopedia/movements",
      disabled: !mainMovementSlug,
    },
    {
      label: "Collaborators",
      title: topCollaborator
        ? `Explore ${topCollaborator.name}`
        : "Explore Frequent Collaborators",
      description: topCollaborator
        ? "Follow the actor connection from this director’s filmography."
        : "Collaborator data is not available yet.",
      href: topCollaborator
        ? `/encyclopedia/actors/${topCollaborator.slug}`
        : "/encyclopedia/actors",
      disabled: !topCollaborator,
    },
    {
        label: "Similar Directors",
        title:
            director.relatedDirectorSlugs?.length
            ? "Explore Related Directors"
            : "Explore Similar Directors",
        description:
            director.relatedDirectorSlugs?.length
            ? "Continue exploring filmmakers connected through style, influence, or cinematic context."
            : "Related directors are not available yet.",
        href:
            director.relatedDirectorSlugs?.length
            ? `/encyclopedia/directors/${director.relatedDirectorSlugs[0]}`
            : "/encyclopedia/directors",
        disabled: !director.relatedDirectorSlugs?.length,
        },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-10">
          <p className="mb-3 text-sm text-neutral-400">
            Director Encyclopedia
          </p>

          <h1 className="text-3xl font-bold text-white">{director.name}</h1>

          <p className="mt-1 text-lg text-neutral-400">{director.nameKo}</p>

          <div className="mt-6 space-y-4 text-sm text-neutral-300">
            <div>
              <p className="text-neutral-500">Country</p>
              <Link
                href={`/encyclopedia/countries/${director.countrySlug}`}
                className="mt-1 inline-block hover:text-white"
              >
                {director.countryFlag} {director.country}
              </Link>
            </div>

            <div>
              <p className="text-neutral-500">Years</p>
              <p className="mt-1">
                {director.birthYear}
                {director.deathYear ? `–${director.deathYear}` : "–"}
              </p>
            </div>

            <div>
              <p className="text-neutral-500">Known For</p>
              <p className="mt-1">{knownForMovies.length} film</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {director.styleKeywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300"
              >
                {keyword}
              </span>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <Section title="Director Profile">
            <p className="leading-7 text-neutral-300">
              {director.description}
            </p>
          </Section>

          <Section title="Quick Facts">
            <InformationGrid items={quickFacts} />
          </Section>

          <Section title="Why This Director Matters">
            <p className="leading-7 text-neutral-300">
              {director.whyMatters ?? director.description}
            </p>
          </Section>

          <Section title="Signature Style">
            <ul className="space-y-3">
              {(director.signatureStyle ?? director.styleKeywords).map(
                (style) => (
                  <li key={style} className="leading-7 text-neutral-300">
                    <span className="mr-2 text-neutral-500">•</span>
                    {style}
                  </li>
                )
              )}
            </ul>
          </Section>

          <Section title="Key Themes">
            {director.keyThemes && director.keyThemes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {director.keyThemes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm text-neutral-200"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400">Key themes are not added yet.</p>
            )}
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
            <FilmographyTimeline items={filmographyMovies} />
            <FrequentCollaborators items={frequentCollaborators} />
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
                  {director.startingPointReason ??
                    "This film is a strong entry point into this director’s cinematic world."}
                </p>
              </Link>
            ) : (
              <p className="text-neutral-400">
                Recommended starting point has not been selected yet.
              </p>
            )}
          </Section>

          <InfluenceRelatedDirectors
            director={director}
            directors={directors}
            />

            <ContinueJourney
            subtitle="이 감독에서 출발해 영화, 국가, 사조, 배우, 다른 감독으로 탐험을 이어가세요."
            items={journeyItems}
            />
        </div>
      </div>
    </main>
  );
}
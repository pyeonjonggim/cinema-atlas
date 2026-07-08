import Image from "next/image";
import Link from "next/link";

import type { Movie } from "@/types/movie";
import RelationshipPreviewPattern, {
  RelationshipPreviewItem,
} from "./RelationshipPreviewPattern";

type MovieRelatedMoviesPatternProps = {
  movie: Movie;
  movies: Movie[];
};

function getReason(movie: Movie, relatedMovie: Movie) {
  if (relatedMovie.directorSlug === movie.directorSlug) {
    return "Same Director";
  }

  if (relatedMovie.countrySlug === movie.countrySlug) {
    return "Same Country";
  }

  const sharedTheme = movie.themes?.find((theme) =>
    relatedMovie.themes?.includes(theme)
  );

  if (sharedTheme) {
    return `Similar Theme: ${sharedTheme}`;
  }

  if (relatedMovie.movementSlug === movie.movementSlug) {
    return "Same Movement";
  }

  return "Continue your exploration";
}

export default function MovieRelatedMoviesPattern({
  movie,
  movies,
}: MovieRelatedMoviesPatternProps) {
  const explicitRelatedIds = [
    ...(movie.relatedMovieIds ?? []),
    ...(movie.recommendedMovieIds ?? []),
  ];

  const relatedMovies = movies
    .filter((item) => item.id !== movie.id)
    .filter((item) => {
      if (explicitRelatedIds.includes(item.id)) return true;

      return (
        item.directorSlug === movie.directorSlug ||
        item.countrySlug === movie.countrySlug ||
        item.movementSlug === movie.movementSlug ||
        Boolean(movie.themes?.some((theme) => item.themes?.includes(theme)))
      );
    });

  const items: RelationshipPreviewItem[] = relatedMovies.map((relatedMovie) => ({
    href: `/movies/${relatedMovie.id}`,
    label: getReason(movie, relatedMovie),
    title: relatedMovie.title,
    subtitle: `${relatedMovie.year} · ${relatedMovie.country}`,
    meta: relatedMovie.director,
    image: relatedMovie.poster || undefined,
    imageAlt: relatedMovie.title,
    visualTone: "movie",
  }));

  return (
    <RelationshipPreviewPattern
      title="Related Movies"
      description="Each recommendation explains why this film is a meaningful next step."
      items={items}
      viewAllHref="/movies"
      viewAllLabel="View All Movies"
      emptyMessage="Related movies will appear as the atlas grows."
      renderItem={(item) => (
        <Link
          href={item.href}
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]"
        >
          <div className="grid grid-cols-[72px_1fr] gap-3 p-3">
            <div className="relative overflow-hidden rounded-xl bg-neutral-900">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.imageAlt ?? item.title}
                  width={144}
                  height={216}
                  sizes="72px"
                  className="aspect-[2/3] h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="aspect-[2/3] bg-gradient-to-br from-neutral-800 to-neutral-950" />
              )}
            </div>

            <div className="min-w-0 py-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {item.label}
              </p>
              <h3 className="mt-2 line-clamp-2 text-base font-semibold text-white">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="mt-2 line-clamp-1 text-xs text-neutral-500">
                  {item.subtitle}
                </p>
              )}
              {item.meta && (
                <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
                  {item.meta}
                </p>
              )}
            </div>
          </div>
        </Link>
      )}
    />
  );
}

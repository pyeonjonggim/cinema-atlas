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
  }));

  return (
    <RelationshipPreviewPattern
      title="Related Movies"
      description="Each recommendation explains why this film is a meaningful next step."
      items={items}
      viewAllHref="/movies"
      viewAllLabel="View All Movies"
      emptyMessage="Related movies will appear as the atlas grows."
    />
  );
}

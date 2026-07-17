import type {
  ExternalIds,
  MovieEditorialMetadata,
  MovieExternalMetadata,
} from "@/types/catalog";
import type { EntityImage } from "@/lib/media";

export type MovieDifficulty = "beginner" | "intermediate" | "advanced";

export type MovieCastMember = {
  actorId: string;
  character?: string;
  billingOrder?: number;
  isLead?: boolean;
};

export type MovieAwardMention = {
  awardId: string;
  title?: string;
  result?: "winner" | "nominee" | "selection";
  year?: number;
};

export type Movie = {
  id: string;
  slug?: string;
  externalIds?: ExternalIds;

  title: string;
  originalTitle: string;
  year: number;
  releaseDate?: string;
  externalMetadata?: MovieExternalMetadata;
  editorial?: MovieEditorialMetadata;

  countryIds?: string[];
  directorIds?: string[];
  actorIds?: string[];
  movementIds?: string[];
  awardIds?: string[];
  productionCompanyIds?: string[];

  /** @deprecated Use countryIds for relationships and country only for display fallback. */
  country: string;
  /** @deprecated Use countryIds. Kept optional-first for existing routes and UI. */
  countrySlug: string;
  countryFlag: string;

  language?: string;
  languageIds?: string[];

  /** @deprecated Use directorIds for relationships and director only for display fallback. */
  director: string;
  /** @deprecated Use directorIds. Kept optional-first for existing routes and UI. */
  directorSlug: string;

  /** @deprecated Use cast.actorId or actorIds for relationships. */
  actors: string[];
  /** @deprecated Use actorIds. Kept optional-first for existing routes and UI. */
  actorSlugs: string[];
  cast?: MovieCastMember[];

  genre: string;
  genreIds?: string[];
  genres?: string[];

  /** @deprecated Use movementIds for relationships and movement only for display fallback. */
  movement: string;
  /** @deprecated Use movementIds. Kept optional-first for existing routes and UI. */
  movementSlug: string;

  /** @deprecated Use awardMentions or awardIds for relationships. */
  awards: string[];
  /** @deprecated Use awardIds. Kept optional-first for existing routes and UI. */
  awardSlugs: string[];
  awardMentions?: MovieAwardMention[];

  difficulty: MovieDifficulty;

  averageRating?: number;
  externalRating?: number;
  /** Movie-level average/external rating. User rating belongs to UserMovie. */
  rating: number;
  /** @deprecated User-specific rating belongs to UserMovie.myRating. */
  myRating?: number;
  runtime: number;
  /** @deprecated User-specific watch date belongs to UserMovie.watchedDate. */
  watchedDate?: string;

  /** @deprecated User-specific reflection belongs to JournalEntry.body. */
  memo?: string;
  whyMatters?: string;
  synopsis?: string;
  themes?: string[];
  style?: string[];
  historicalContext?: string[];
  relatedMovieIds?: string[];
  recommendedMovieIds?: string[];

  /** Current compatibility display image. Prefer posterPath/posterUrl for imports. */
  poster: string;
  posterPath?: string;
  posterUrl?: string;
  posterImage?: EntityImage | null;
  /** Current compatibility backdrop image. Prefer backdropPath/backdropUrl for imports. */
  backdrop?: string;
  backdropPath?: string;
  backdropUrl?: string;
  backdropImage?: EntityImage | null;
};

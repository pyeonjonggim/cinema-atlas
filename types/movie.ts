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

  title: string;
  originalTitle: string;
  year: number;

  country: string;
  countrySlug: string;
  countryFlag: string;

  language?: string;

  director: string;
  directorSlug: string;

  actors: string[];
  actorSlugs: string[];
  cast?: MovieCastMember[];

  genre: string;
  genres?: string[];

  movement: string;
  movementSlug: string;

  awards: string[];
  awardSlugs: string[];
  awardMentions?: MovieAwardMention[];

  difficulty: MovieDifficulty;

  rating: number;
  myRating?: number;
  runtime: number;
  watchedDate: string;

  memo: string;
  whyMatters?: string;
  synopsis?: string;
  themes?: string[];
  style?: string[];
  historicalContext?: string[];
  relatedMovieIds?: string[];
  recommendedMovieIds?: string[];
  poster: string;
  backdrop?: string;
};

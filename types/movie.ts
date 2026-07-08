export type MovieDifficulty = "beginner" | "intermediate" | "advanced";

export type Movie = {
  id: string;

  title: string;
  originalTitle: string;
  year: number;

  country: string;
  countrySlug: string;
  countryFlag: string;

  director: string;
  directorSlug: string;

  actors: string[];
  actorSlugs: string[];

  genre: string;

  movement: string;
  movementSlug: string;

  awards: string[];
  awardSlugs: string[];

  difficulty: MovieDifficulty;

  rating: number;
  runtime: number;
  watchedDate: string;

  memo: string;
  poster: string;
};
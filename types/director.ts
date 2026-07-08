export type Director = {
  slug: string;

  name: string;
  nameKo: string;

  country: string;
  countrySlug: string;
  countryFlag: string;

  birthYear: number;
  deathYear?: number;

  description: string;

  styleKeywords: string[];
  knownForMovieIds: string[];

  whyMatters?: string;
  signatureStyle?: string[];
  keyThemes?: string[];

  essentialMovieIds?: string[];
  starterMovieId?: string;
  startingPointReason?: string;

  influencedByDirectorSlugs?: string[];
  influencedDirectorSlugs?: string[];
  relatedDirectorSlugs?: string[];
};
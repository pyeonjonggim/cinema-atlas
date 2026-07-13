export type CatalogEntityType =
  | "movie"
  | "director"
  | "actor"
  | "country"
  | "movement"
  | "award"
  | "production-company"
  | "genre"
  | "language";

export type ExternalIds = {
  tmdbId?: number;
  imdbId?: string;
  wikidataId?: string;
  letterboxdSlug?: string;
  sourceIds?: Record<string, string | number>;
};

export type CatalogAssetSource = "external-metadata" | "cinema-atlas" | "user";

export type CatalogImageRef = {
  path?: string;
  url?: string;
  alt?: string;
  source: CatalogAssetSource;
  sourceId?: string;
};

export type CatalogImageSet = {
  poster?: CatalogImageRef;
  backdrop?: CatalogImageRef;
  profile?: CatalogImageRef;
  posters?: CatalogImageRef[];
  backdrops?: CatalogImageRef[];
  profiles?: CatalogImageRef[];
};

export type CatalogCredit = {
  externalPersonId?: string;
  name: string;
  role: "director" | "writer" | "actor" | "producer" | "crew";
  character?: string;
  department?: string;
  billingOrder?: number;
  profileImage?: CatalogImageRef;
  externalIds?: ExternalIds;
};

export type MovieExternalMetadata = {
  title?: string;
  originalTitle?: string;
  releaseDate?: string;
  runtime?: number;
  overview?: string;
  poster?: CatalogImageRef;
  backdrop?: CatalogImageRef;
  productionCountryIds?: string[];
  productionCompanyIds?: string[];
  spokenLanguageIds?: string[];
  genreIds?: string[];
  creditIds?: string[];
  externalRating?: number;
  popularity?: number;
  source: "tmdb" | "imdb" | "wikidata" | "manual" | "mixed";
  fetchedAt?: string;
};

export type ExternalMovieRecord = {
  provider: "tmdb" | "imdb" | "wikidata" | "manual" | "mixed";
  providerMovieId: string;
  externalIds: ExternalIds;
  metadata: MovieExternalMetadata;
  credits?: CatalogCredit[];
  images?: CatalogImageSet;
};

export type CanonicalMovieDraft = {
  id: string;
  externalIds: ExternalIds;
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  year?: number;
  runtime?: number;
  countryIds: string[];
  directorIds: string[];
  actorIds: string[];
  productionCompanyIds: string[];
  genreIds: string[];
  languageIds: string[];
  externalMetadata: MovieExternalMetadata;
  editorial?: MovieEditorialMetadata;
};

export type CatalogProviderMovieSearchResult = {
  provider: ExternalMovieRecord["provider"];
  providerMovieId: string;
  title: string;
  originalTitle?: string;
  releaseYear?: number;
  overview?: string;
  poster?: CatalogImageRef;
  externalIds?: ExternalIds;
};

export type CatalogProviderSearchMovieInput = {
  query: string;
  year?: number;
  language?: string;
  page?: number;
};

export type CatalogImageConfiguration = {
  provider: ExternalMovieRecord["provider"];
  baseUrl?: string;
  secureBaseUrl?: string;
  posterSizes: string[];
  backdropSizes: string[];
  profileSizes: string[];
};

export type CatalogProviderErrorCode =
  | "not-found"
  | "unauthorized"
  | "rate-limited"
  | "network"
  | "malformed-response"
  | "provider-down"
  | "unknown";

export type CatalogProviderError = {
  provider: ExternalMovieRecord["provider"];
  code: CatalogProviderErrorCode;
  message: string;
  status?: number;
  retryable: boolean;
};

export type CatalogProvider = {
  readonly name: ExternalMovieRecord["provider"];
  searchMovie(
    input: CatalogProviderSearchMovieInput,
  ): Promise<CatalogProviderMovieSearchResult[]>;
  getMovieDetails(providerMovieId: string): Promise<ExternalMovieRecord>;
  getMovieCredits(providerMovieId: string): Promise<CatalogCredit[]>;
  getMovieExternalIds(providerMovieId: string): Promise<ExternalIds>;
  getMovieImages(providerMovieId: string): Promise<CatalogImageSet>;
  getImageConfiguration(): Promise<CatalogImageConfiguration>;
};

export type MovieEditorialMetadata = {
  whyMatters?: string;
  atlasNote?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  essential?: boolean;
  starter?: boolean;
  studyTopicIds?: string[];
  explorerTags?: string[];
  relatedJourneyIds?: string[];
  recommendedMovieIds?: string[];
};

export type ProductionCompany = {
  slug: string;
  name: string;
  countryId?: string;
  externalIds?: ExternalIds;
};

export type Genre = {
  slug: string;
  name: string;
  externalIds?: ExternalIds;
};

export type Language = {
  slug: string;
  name: string;
  iso6391?: string;
  iso6392?: string;
};

export type CatalogImportStage =
  | "raw"
  | "normalized"
  | "matched"
  | "validated"
  | "ready";

export type CatalogImportIssue = {
  severity: "error" | "warning";
  stage: CatalogImportStage;
  entityType: CatalogEntityType;
  entityId?: string;
  field: string;
  message: string;
};

export type CatalogImportResult<T> = {
  stage: CatalogImportStage;
  records: T[];
  issues: CatalogImportIssue[];
};

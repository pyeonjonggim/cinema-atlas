export type RawMovieSource =
  | "tmdb"
  | "imdb"
  | "wikidata"
  | "watcha"
  | "letterboxd"
  | "csv"
  | "excel"
  | "manual"
  | "mixed"
  | "unknown";

export type RawMovieRecord = {
  rawTitle: string;
  originalTitle?: string;
  year?: string | number;
  runtime?: string | number;
  rating?: string | number;
  watchedDate?: string | Date;
  directorNames?: string[] | string;
  actorNames?: string[] | string;
  countryNames?: string[] | string;
  genreNames?: string[] | string;
  movementNames?: string[] | string;
  awardNames?: string[] | string;
  posterUrl?: string;
  backdropUrl?: string;
  memo?: string;
  source?: RawMovieSource;
  sourceId?: string;
};

export type NormalizedMovieRecord = {
  title: string;
  titleKey: string;
  originalTitle?: string;
  originalTitleKey?: string;
  year?: number;
  runtime?: number;
  rating?: number;
  watchedDate?: string;
  directorNames: string[];
  actorNames: string[];
  countryNames: string[];
  genreNames: string[];
  movementNames: string[];
  awardNames: string[];
  posterUrl?: string;
  backdropUrl?: string;
  memo?: string;
  source: RawMovieSource;
  sourceId?: string;
  duplicateKeys: string[];
};

export type ImportDuplicateCandidate = {
  key: string;
  recordIndexes: number[];
};

export type ImportNormalizationResult = {
  records: NormalizedMovieRecord[];
  duplicateCandidates: ImportDuplicateCandidate[];
};

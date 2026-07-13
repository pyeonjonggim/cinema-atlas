export type TmdbSearchResult = {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
};

export type TmdbSearchResponse = {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
};

export type TmdbNamedItem = {
  id: number;
  name: string;
};

export type TmdbMovieDetail = {
  id: number;
  imdb_id?: string | null;
  title?: string;
  original_title?: string;
  release_date?: string;
  runtime?: number | null;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  popularity?: number;
  genres?: TmdbNamedItem[];
  production_countries?: { iso_3166_1: string; name: string }[];
  production_companies?: { id: number; name: string; origin_country?: string }[];
  spoken_languages?: { iso_639_1?: string; iso_639_2?: string; english_name?: string; name?: string }[];
};

export type TmdbCreditPerson = {
  id: number;
  name?: string;
  profile_path?: string | null;
};

export type TmdbCastMember = TmdbCreditPerson & {
  character?: string;
  order?: number;
};

export type TmdbCrewMember = TmdbCreditPerson & {
  job?: string;
  department?: string;
};

export type TmdbCredits = {
  id: number;
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
};

export type TmdbExternalIds = {
  id: number;
  imdb_id?: string | null;
  wikidata_id?: string | null;
};

export type TmdbImage = {
  file_path: string;
  width?: number;
  height?: number;
  iso_639_1?: string | null;
};

export type TmdbImages = {
  id: number;
  backdrops?: TmdbImage[];
  posters?: TmdbImage[];
};

export type TmdbConfiguration = {
  images?: {
    base_url?: string;
    secure_base_url?: string;
    backdrop_sizes?: string[];
    poster_sizes?: string[];
    profile_sizes?: string[];
  };
};


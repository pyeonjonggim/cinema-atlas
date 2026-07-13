import type {
  CatalogCredit,
  CatalogImageConfiguration,
  CatalogImageRef,
  CatalogImageSet,
  CatalogProvider,
  CatalogProviderError,
  CatalogProviderMovieSearchResult,
  CatalogProviderSearchMovieInput,
  ExternalIds,
  ExternalMovieRecord,
} from "@/types/catalog";
import type {
  TmdbConfiguration,
  TmdbCredits,
  TmdbExternalIds,
  TmdbImage,
  TmdbImages,
  TmdbMovieDetail,
  TmdbSearchResponse,
  TmdbSearchResult,
} from "@/types/catalog/tmdb";

type TmdbProviderOptions = {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
};

type RequestOptions = {
  retry?: boolean;
};

const DEFAULT_TMDB_BASE_URL = "https://api.themoviedb.org/3";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createProviderError(input: Omit<CatalogProviderError, "provider">): Error & {
  catalogError: CatalogProviderError;
} {
  const error = new Error(input.message) as Error & {
    catalogError: CatalogProviderError;
  };
  error.catalogError = {
    provider: "tmdb",
    ...input,
  };
  return error;
}

function getReleaseYear(releaseDate?: string): number | undefined {
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : undefined;
  return Number.isInteger(year) ? year : undefined;
}

function makeTmdbImage(path?: string | null, alt?: string): CatalogImageRef | undefined {
  if (!path) {
    return undefined;
  }

  return {
    path,
    alt,
    source: "external-metadata",
    sourceId: "tmdb",
  };
}

function mapTmdbImage(image: TmdbImage, alt?: string): CatalogImageRef {
  return {
    path: image.file_path,
    alt,
    source: "external-metadata",
    sourceId: "tmdb",
  };
}

function mapSearchResult(result: TmdbSearchResult): CatalogProviderMovieSearchResult {
  return {
    provider: "tmdb",
    providerMovieId: String(result.id),
    title: result.title ?? result.original_title ?? "Untitled Movie",
    originalTitle: result.original_title,
    releaseYear: getReleaseYear(result.release_date),
    overview: result.overview,
    poster: makeTmdbImage(result.poster_path, result.title),
    externalIds: {
      tmdbId: result.id,
    },
  };
}

function mapCredits(credits: TmdbCredits): CatalogCredit[] {
  const crew = credits.crew ?? [];
  const cast = credits.cast ?? [];

  const keyCrew = crew
    .filter((member) => ["Director", "Writer", "Screenplay", "Producer"].includes(member.job ?? ""))
    .map<CatalogCredit>((member) => ({
      externalPersonId: String(member.id),
      name: member.name ?? "Unknown",
      role:
        member.job === "Director"
          ? "director"
          : member.job === "Producer"
            ? "producer"
            : "writer",
      department: member.department,
      profileImage: makeTmdbImage(member.profile_path, member.name),
      externalIds: {
        tmdbId: member.id,
      },
    }));

  const leadCast = cast.slice(0, 20).map<CatalogCredit>((member) => ({
    externalPersonId: String(member.id),
    name: member.name ?? "Unknown",
    role: "actor",
    character: member.character,
    billingOrder: member.order,
    profileImage: makeTmdbImage(member.profile_path, member.name),
    externalIds: {
      tmdbId: member.id,
    },
  }));

  return [...keyCrew, ...leadCast];
}

function mapExternalIds(tmdbId: string, ids: TmdbExternalIds): ExternalIds {
  return {
    tmdbId: Number(tmdbId),
    imdbId: ids.imdb_id ?? undefined,
    wikidataId: ids.wikidata_id ?? undefined,
  };
}

function mapImages(images: TmdbImages, title?: string): CatalogImageSet {
  return {
    posters: (images.posters ?? []).map((image) => mapTmdbImage(image, title)),
    backdrops: (images.backdrops ?? []).map((image) => mapTmdbImage(image, title)),
    poster: images.posters?.[0] ? mapTmdbImage(images.posters[0], title) : undefined,
    backdrop: images.backdrops?.[0] ? mapTmdbImage(images.backdrops[0], title) : undefined,
  };
}

export class TmdbCatalogProvider implements CatalogProvider {
  readonly name = "tmdb" as const;

  private readonly apiKey?: string;
  private readonly accessToken?: string;
  private readonly baseUrl: string;

  constructor(options: TmdbProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.accessToken = options.accessToken;
    this.baseUrl = options.baseUrl ?? DEFAULT_TMDB_BASE_URL;
  }

  async searchMovie(
    input: CatalogProviderSearchMovieInput,
  ): Promise<CatalogProviderMovieSearchResult[]> {
    const params = new URLSearchParams({
      query: input.query,
      page: String(input.page ?? 1),
    });

    if (input.year) {
      params.set("year", String(input.year));
    }

    if (input.language) {
      params.set("language", input.language);
    }

    const response = await this.request<TmdbSearchResponse>(`/search/movie?${params.toString()}`);
    if (!Array.isArray(response.results)) {
      throw createProviderError({
        code: "malformed-response",
        message: "TMDB search response did not include a results array.",
        retryable: false,
      });
    }

    return response.results.map(mapSearchResult);
  }

  async getMovieDetails(providerMovieId: string): Promise<ExternalMovieRecord> {
    const [details, credits, externalIds, images] = await Promise.all([
      this.request<TmdbMovieDetail>(`/movie/${providerMovieId}`),
      this.getMovieCredits(providerMovieId),
      this.getMovieExternalIds(providerMovieId),
      this.getMovieImages(providerMovieId),
    ]);

    if (!details.id) {
      throw createProviderError({
        code: "malformed-response",
        message: "TMDB movie detail response did not include an id.",
        retryable: false,
      });
    }

    return {
      provider: "tmdb",
      providerMovieId: String(details.id),
      externalIds: {
        ...externalIds,
        tmdbId: details.id,
        imdbId: externalIds.imdbId ?? details.imdb_id ?? undefined,
      },
      metadata: {
        title: details.title,
        originalTitle: details.original_title,
        releaseDate: details.release_date,
        runtime: details.runtime ?? undefined,
        overview: details.overview,
        poster: makeTmdbImage(details.poster_path, details.title),
        backdrop: makeTmdbImage(details.backdrop_path, details.title),
        productionCountryIds: details.production_countries?.map((country) =>
          country.iso_3166_1.toLocaleLowerCase("en-US"),
        ),
        productionCompanyIds: details.production_companies?.map((company) => String(company.id)),
        spokenLanguageIds: details.spoken_languages
          ?.map((language) => language.iso_639_1 ?? language.iso_639_2)
          .filter((language): language is string => Boolean(language)),
        genreIds: details.genres?.map((genre) => String(genre.id)),
        creditIds: credits
          .map((credit) => credit.externalPersonId)
          .filter((id): id is string => Boolean(id)),
        externalRating: details.vote_average,
        popularity: details.popularity,
        source: "tmdb",
        fetchedAt: new Date().toISOString(),
      },
      credits,
      images,
    };
  }

  async getMovieCredits(providerMovieId: string): Promise<CatalogCredit[]> {
    const response = await this.request<TmdbCredits>(`/movie/${providerMovieId}/credits`);
    return mapCredits(response);
  }

  async getMovieExternalIds(providerMovieId: string): Promise<ExternalIds> {
    const response = await this.request<TmdbExternalIds>(
      `/movie/${providerMovieId}/external_ids`,
    );
    return mapExternalIds(providerMovieId, response);
  }

  async getMovieImages(providerMovieId: string): Promise<CatalogImageSet> {
    const response = await this.request<TmdbImages>(`/movie/${providerMovieId}/images`);
    return mapImages(response);
  }

  async getImageConfiguration(): Promise<CatalogImageConfiguration> {
    const response = await this.request<TmdbConfiguration>("/configuration");
    return {
      provider: "tmdb",
      baseUrl: response.images?.base_url,
      secureBaseUrl: response.images?.secure_base_url,
      posterSizes: response.images?.poster_sizes ?? [],
      backdropSizes: response.images?.backdrop_sizes ?? [],
      profileSizes: response.images?.profile_sizes ?? [],
    };
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!this.apiKey && !this.accessToken) {
      throw createProviderError({
        code: "unauthorized",
        message: "TMDB provider requires TMDB_API_KEY or TMDB_ACCESS_TOKEN.",
        status: 401,
        retryable: false,
      });
    }

    const url = new URL(`${this.baseUrl}${path}`);
    if (this.apiKey && !this.accessToken) {
      url.searchParams.set("api_key", this.apiKey);
    }

    try {
      const response = await fetch(url, {
        headers: this.accessToken
          ? {
              Authorization: `Bearer ${this.accessToken}`,
              Accept: "application/json",
            }
          : {
              Accept: "application/json",
            },
      });

      if (response.status === 401) {
        throw createProviderError({
          code: "unauthorized",
          message: "TMDB request was unauthorized.",
          status: response.status,
          retryable: false,
        });
      }

      if (response.status === 404) {
        throw createProviderError({
          code: "not-found",
          message: "TMDB movie was not found.",
          status: response.status,
          retryable: false,
        });
      }

      if (response.status === 429) {
        throw createProviderError({
          code: "rate-limited",
          message: "TMDB rate limit reached.",
          status: response.status,
          retryable: false,
        });
      }

      if (!response.ok) {
        throw createProviderError({
          code: response.status >= 500 ? "provider-down" : "unknown",
          message: `TMDB request failed with status ${response.status}.`,
          status: response.status,
          retryable: response.status >= 500,
        });
      }

      const data: unknown = await response.json();
      if (!isRecord(data)) {
        throw createProviderError({
          code: "malformed-response",
          message: "TMDB returned a malformed JSON payload.",
          retryable: false,
        });
      }

      return data as T;
    } catch (error) {
      const providerError = error as Error & { catalogError?: CatalogProviderError };
      if (providerError.catalogError) {
        throw error;
      }

      if (options.retry === false) {
        throw createProviderError({
          code: "network",
          message: providerError.message || "TMDB network request failed.",
          retryable: false,
        });
      }

      return this.request<T>(path, { retry: false });
    }
  }
}

export function createTmdbCatalogProviderFromEnv(): TmdbCatalogProvider {
  return new TmdbCatalogProvider({
    apiKey: process.env.TMDB_API_KEY,
    accessToken: process.env.TMDB_ACCESS_TOKEN,
  });
}


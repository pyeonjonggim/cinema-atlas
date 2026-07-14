import catalogEdges from "@/data/imports/catalog-persistence-pilot/edges.json";
import catalogEntities from "@/data/imports/catalog-persistence-pilot/entities.json";
import catalogMovies from "@/data/imports/catalog-persistence-pilot/movies.json";
import { actors } from "@/data/actors";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { movies as staticMovies } from "@/data/movies";
import type { MovieExternalMetadata } from "@/types/catalog";
import type { Movie } from "@/types/movie";

type CatalogEdge = {
  sourceType: string;
  sourceId: string;
  relationType: string;
  targetType: string;
  targetId: string;
};

type CatalogPerson = {
  id: string;
  name: string;
  roles?: string[];
};

type CatalogMovie = {
  id: string;
  externalIds?: Movie["externalIds"];
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  year?: number;
  runtime?: number;
  externalMetadata?: {
    overview?: string;
    externalRating?: number;
    productionCountryIds?: string[];
    genreIds?: string[];
    spokenLanguageIds?: string[];
    poster?: { path?: string; url?: string };
    backdrop?: { path?: string; url?: string };
  };
};

type CatalogEntitiesArtifact = {
  people: CatalogPerson[];
  countries: Array<{ id: string; name?: string }>;
  genres: Array<{ id: string; name?: string; externalIds?: { sourceIds?: Record<string, string | number> } }>;
  languages: Array<{ id: string; name?: string }>;
  companies: Array<{ id: string; name?: string }>;
};

type QueryMetrics = {
  queryCalls: number;
  repositoryReads: number;
  graphReads: number;
};

const countryIdToLegacySlug: Record<string, string> = {
  kr: "korea",
  us: "united-states",
  jp: "japan",
  it: "italy",
};

const languageNames: Record<string, string> = {
  en: "English",
  de: "German",
  ko: "Korean",
  ja: "Japanese",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  cn: "Cantonese",
  zh: "Mandarin",
};

const genreNames: Record<string, string> = {
  "12": "Adventure",
  "14": "Fantasy",
  "16": "Animation",
  "18": "Drama",
  "27": "Horror",
  "28": "Action",
  "35": "Comedy",
  "36": "History",
  "53": "Thriller",
  "80": "Crime",
  "99": "Documentary",
  "878": "Science Fiction",
  "9648": "Mystery",
  "10402": "Music",
  "10749": "Romance",
  "10751": "Family",
  "10752": "War",
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleYearKey(movie: Pick<Movie, "title" | "year">): string {
  return `${normalizeName(movie.title)}:${movie.year}`;
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

class CatalogQueryService {
  private readonly entities = catalogEntities as CatalogEntitiesArtifact;
  private readonly catalogMovieRecords = catalogMovies as CatalogMovie[];
  private readonly edgeRecords = catalogEdges as CatalogEdge[];
  private readonly peopleById = new Map(this.entities.people.map((person) => [person.id, person]));
  private readonly edgesFromMovie = new Map<string, CatalogEdge[]>();
  private readonly edgesToEntity = new Map<string, CatalogEdge[]>();
  private readonly movieCache: Movie[];
  private readonly movieById: Map<string, Movie>;
  private metrics: QueryMetrics = {
    queryCalls: 0,
    repositoryReads: 0,
    graphReads: 0,
  };

  constructor() {
    this.edgeRecords.forEach((edge) => {
      if (edge.sourceType === "movie") {
        if (!this.edgesFromMovie.has(edge.sourceId)) {
          this.edgesFromMovie.set(edge.sourceId, []);
        }
        this.edgesFromMovie.get(edge.sourceId)?.push(edge);
      }

      const targetKey = `${edge.targetType}:${edge.targetId}`;
      if (!this.edgesToEntity.has(targetKey)) {
        this.edgesToEntity.set(targetKey, []);
      }
      this.edgesToEntity.get(targetKey)?.push(edge);
    });

    const catalogMapped = this.catalogMovieRecords.map((movie) => this.mapCatalogMovie(movie));
    const catalogKeys = new Set(catalogMapped.map(titleYearKey));
    this.movieCache = [
      ...catalogMapped,
      ...staticMovies.filter((movie) => !catalogKeys.has(titleYearKey(movie))),
    ];

    this.movieById = new Map(
      this.movieCache.flatMap((movie) =>
        unique([movie.id, movie.slug]).map((id) => [id, movie] as const),
      ),
    );

    staticMovies.forEach((movie) => {
      if (!this.movieById.has(movie.id)) {
        this.movieById.set(movie.id, movie);
      }
    });
  }

  listMovies(): Movie[] {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;
    return this.movieCache;
  }

  async listMoviesAsync(): Promise<Movie[]> {
    return this.listMovies();
  }

  getMovieById(id: string): Movie | undefined {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;
    return this.movieById.get(id);
  }

  async getMovieByIdAsync(id: string): Promise<Movie | undefined> {
    return this.getMovieById(id);
  }

  getDirectorFilmography(directorId: string): Movie[] {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    return this.listMovies().filter((movie) =>
      unique([movie.directorSlug, ...(movie.directorIds ?? [])]).includes(directorId),
    );
  }

  async getDirectorFilmographyAsync(directorId: string): Promise<Movie[]> {
    return this.getDirectorFilmography(directorId);
  }

  getCountryMovies(countryId: string): Movie[] {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    return this.listMovies().filter((movie) =>
      unique([movie.countrySlug, ...(movie.countryIds ?? [])]).includes(countryId),
    );
  }

  async getCountryMoviesAsync(countryId: string): Promise<Movie[]> {
    return this.getCountryMovies(countryId);
  }

  getActorFilmography(actorId: string): Movie[] {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    return this.listMovies().filter((movie) =>
      unique([...(movie.actorIds ?? []), ...movie.actorSlugs]).includes(actorId),
    );
  }

  getMoviesByGenre(genreId: string): Movie[] {
    this.metrics.queryCalls += 1;
    return this.listMovies().filter((movie) =>
      unique([movie.genre, ...(movie.genreIds ?? []), ...(movie.genres ?? [])])
        .map((value) => value.toLowerCase())
        .includes(genreId.toLowerCase()),
    );
  }

  getMoviesByLanguage(languageId: string): Movie[] {
    this.metrics.queryCalls += 1;
    return this.listMovies().filter((movie) =>
      unique([movie.language, ...(movie.languageIds ?? [])])
        .map((value) => value.toLowerCase())
        .includes(languageId.toLowerCase()),
    );
  }

  getMoviesByCompany(companyId: string): Movie[] {
    this.metrics.queryCalls += 1;
    return this.listMovies().filter((movie) =>
      (movie.productionCompanyIds ?? []).includes(companyId),
    );
  }

  getRelatedMovies(movieId: string): Movie[] {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    const movie = this.getMovieById(movieId);
    if (!movie) return [];

    const relatedIds = new Set(movie.relatedMovieIds ?? []);
    this.listMovies().forEach((candidate) => {
      if (candidate.id === movie.id) return;
      if (
        candidate.countrySlug === movie.countrySlug ||
        candidate.directorSlug === movie.directorSlug ||
        candidate.movementSlug === movie.movementSlug
      ) {
        relatedIds.add(candidate.id);
      }
    });

    return [...relatedIds]
      .map((id) => this.getMovieById(id))
      .filter((item): item is Movie => Boolean(item));
  }

  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = { queryCalls: 0, repositoryReads: 0, graphReads: 0 };
  }

  private mapCatalogMovie(record: CatalogMovie): Movie {
    const edges = this.edgesFromMovie.get(record.id) ?? [];
    const directorEdges = edges.filter((edge) => edge.relationType === "MOVIE_DIRECTED_BY_PERSON");
    const actorEdges = edges.filter((edge) => edge.relationType === "MOVIE_ACTED_BY_PERSON");
    const countryEdges = edges.filter((edge) => edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY");
    const genreEdges = edges.filter((edge) => edge.relationType === "MOVIE_HAS_GENRE");
    const languageEdges = edges.filter((edge) => edge.relationType === "MOVIE_USES_LANGUAGE");
    const companyEdges = edges.filter((edge) => edge.relationType === "MOVIE_PRODUCED_BY_COMPANY");

    const directorName = this.personName(directorEdges[0]?.targetId) ?? "Unknown Director";
    const directorSlug = this.legacyDirectorSlug(directorName) ?? directorEdges[0]?.targetId ?? "unknown-director";
    const countryId = countryEdges[0]?.targetId ?? record.externalMetadata?.productionCountryIds?.[0] ?? "unknown";
    const countrySlug = countryIdToLegacySlug[countryId] ?? countryId;
    const country = countries.find((item) => item.slug === countrySlug)?.name ?? countryId.toUpperCase();
    const actorNames = actorEdges.slice(0, 5).map((edge) => this.personName(edge.targetId) ?? edge.targetId);
    const actorSlugs = actorNames.map((name, index) => this.legacyActorSlug(name) ?? actorEdges[index]?.targetId ?? name);
    const genreIds = genreEdges.map((edge) => edge.targetId.replace(/^genre_/, ""));
    const genres = genreIds.map((id) => genreNames[id] ?? id);
    const languageIds = languageEdges.map((edge) => edge.targetId);
    const language = languageNames[languageIds[0] ?? ""] ?? languageIds[0] ?? "Unknown";

    const externalMetadata = this.mapExternalMetadata(record);

    return {
      id: record.id,
      externalIds: record.externalIds,
      title: record.title,
      originalTitle: record.originalTitle ?? record.title,
      releaseDate: record.releaseDate,
      year: record.year ?? 0,
      runtime: record.runtime ?? 0,
      country,
      countryIds: unique([countrySlug, countryId]),
      countrySlug,
      countryFlag: countryId.toUpperCase(),
      language,
      languageIds,
      director: directorName,
      directorIds: unique([directorSlug, ...directorEdges.map((edge) => edge.targetId)]),
      directorSlug,
      actors: actorNames,
      actorIds: actorSlugs,
      actorSlugs,
      cast: actorSlugs.map((actorId, index) => ({
        actorId,
        billingOrder: index + 1,
        isLead: index < 3,
      })),
      genre: genres.length > 0 ? genres.join(" / ") : "Drama",
      genreIds,
      genres,
      movement: "Catalog Import",
      movementIds: [],
      movementSlug: "",
      awards: [],
      awardIds: [],
      awardSlugs: [],
      difficulty: "beginner",
      averageRating: record.externalMetadata?.externalRating,
      externalRating: record.externalMetadata?.externalRating,
      rating: record.externalMetadata?.externalRating
        ? Number((record.externalMetadata.externalRating / 2).toFixed(1))
        : 0,
      whyMatters:
        "This approved catalog record is available through the Cinema Atlas query layer and can gain editorial context over time.",
      synopsis: record.externalMetadata?.overview,
      themes: genres.slice(0, 4),
      style: [],
      historicalContext: ["Imported through the provider-neutral catalog pipeline."],
      relatedMovieIds: [],
      recommendedMovieIds: [],
      productionCompanyIds: companyEdges.map((edge) => edge.targetId),
      poster: "",
      posterPath: record.externalMetadata?.poster?.path,
      backdrop: "",
      backdropPath: record.externalMetadata?.backdrop?.path,
      externalMetadata,
    };
  }

  private mapExternalMetadata(record: CatalogMovie): MovieExternalMetadata | undefined {
    if (!record.externalMetadata) return undefined;

    return {
      title: record.title,
      originalTitle: record.originalTitle,
      releaseDate: record.releaseDate,
      runtime: record.runtime,
      overview: record.externalMetadata.overview,
      externalRating: record.externalMetadata.externalRating,
      productionCountryIds: record.externalMetadata.productionCountryIds,
      spokenLanguageIds: record.externalMetadata.spokenLanguageIds,
      genreIds: record.externalMetadata.genreIds,
      poster: record.externalMetadata.poster
        ? {
            ...record.externalMetadata.poster,
            source: "external-metadata",
          }
        : undefined,
      backdrop: record.externalMetadata.backdrop
        ? {
            ...record.externalMetadata.backdrop,
            source: "external-metadata",
          }
        : undefined,
      source: "tmdb",
    };
  }

  private personName(personId?: string): string | undefined {
    return personId ? this.peopleById.get(personId)?.name : undefined;
  }

  private legacyDirectorSlug(name: string): string | undefined {
    const key = normalizeName(name);
    return directors.find((director) => normalizeName(director.name) === key)?.slug;
  }

  private legacyActorSlug(name: string): string | undefined {
    const key = normalizeName(name);
    return actors.find((actor) => normalizeName(actor.name) === key)?.slug;
  }
}

export const catalogQueryService = new CatalogQueryService();

export const listMovies = () => catalogQueryService.listMovies();
export const listMoviesAsync = () => catalogQueryService.listMoviesAsync();
export const getMovieById = (id: string) => catalogQueryService.getMovieById(id);
export const getMovieByIdAsync = (id: string) => catalogQueryService.getMovieByIdAsync(id);
export const getDirectorFilmography = (directorId: string) =>
  catalogQueryService.getDirectorFilmography(directorId);
export const getDirectorFilmographyAsync = (directorId: string) =>
  catalogQueryService.getDirectorFilmographyAsync(directorId);
export const getCountryMovies = (countryId: string) =>
  catalogQueryService.getCountryMovies(countryId);
export const getCountryMoviesAsync = (countryId: string) =>
  catalogQueryService.getCountryMoviesAsync(countryId);
export const getActorFilmography = (actorId: string) =>
  catalogQueryService.getActorFilmography(actorId);
export const getMoviesByGenre = (genreId: string) =>
  catalogQueryService.getMoviesByGenre(genreId);
export const getMoviesByLanguage = (languageId: string) =>
  catalogQueryService.getMoviesByLanguage(languageId);
export const getMoviesByCompany = (companyId: string) =>
  catalogQueryService.getMoviesByCompany(companyId);
export const getRelatedMovies = (movieId: string) =>
  catalogQueryService.getRelatedMovies(movieId);

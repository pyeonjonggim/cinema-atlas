import "server-only";

import { actors as staticActors, type Actor } from "@/data/actors";
import { countries as staticCountries, type Country } from "@/data/countries";
import { directors as staticDirectors, type Director } from "@/data/directors";
import { movies as staticMovies } from "@/data/movies";
import { hasDatabaseUrl } from "@/lib/db/postgres";
import { PostgresCatalogRepository } from "@/lib/postgresCatalogRepository";
import type { CatalogMovieRecord, KnowledgeGraphEdge } from "@/types/catalogPersistence";
import type { MovieExternalMetadata } from "@/types/catalog";
import type { Movie } from "@/types/movie";

type PersonRow = {
  id: string;
  display_name?: string;
  roles?: string[];
};

type CountryRow = {
  id: string;
  iso_code?: string;
  display_name?: string;
};

type QueryMetrics = {
  queryCalls: number;
  repositoryReads: number;
  graphReads: number;
};

const countryIdToLegacySlug: Record<string, string> = {
  br: "brazil",
  cn: "china",
  de: "germany",
  fr: "france",
  gb: "united-kingdom",
  hk: "hong-kong",
  it: "italy",
  jp: "japan",
  kr: "korea",
  tw: "taiwan",
  us: "united-states",
};

const countrySlugToCatalogId: Record<string, string> = {
  brazil: "br",
  china: "cn",
  france: "fr",
  germany: "de",
  "hong-kong": "hk",
  italy: "it",
  japan: "jp",
  korea: "kr",
  taiwan: "tw",
  "united-kingdom": "gb",
  "united-states": "us",
};

type CountryEditorialProjection = {
  displayName: string;
  slug: string;
  flag: string;
  region: string;
  representativeEra: string;
  knownFor: string;
  description: string;
  whyMatters: string;
  characteristics: string[];
  themes: string[];
};

const countryEditorialProjections: Record<string, CountryEditorialProjection> = {
  br: {
    displayName: "Brazil",
    slug: "brazil",
    flag: "🇧🇷",
    region: "Latin America",
    representativeEra: "Brazilian Cinema",
    knownFor: "Urban life, political memory, and social realism",
    description: "Brazil connects Cinema Atlas to Latin American cinema, urban stories, political memory, and globally influential modern filmmaking.",
    whyMatters: "Brazil helps the catalog show how national cinema can turn city life, inequality, music, and history into urgent cinematic worlds.",
    characteristics: ["Latin American cinema anchor", "Urban and social realism", "Political and historical memory"],
    themes: ["City", "Class", "Memory", "Violence", "Youth"],
  },
  cn: {
    displayName: "China",
    slug: "china",
    flag: "🇨🇳",
    region: "East Asia",
    representativeEra: "Chinese Cinema",
    knownFor: "Historical spectacle, realism, and modern transformation",
    description: "China represents a major East Asian film culture spanning studio filmmaking, art cinema, historical epics, and contemporary social change.",
    whyMatters: "China expands the catalog through language, region, history, and a large body of cinema that shaped global festival and popular film culture.",
    characteristics: ["Major East Asian cinema culture", "Historical and contemporary storytelling", "Festival and popular cinema presence"],
    themes: ["History", "Family", "Modernity", "Memory", "Society"],
  },
  de: {
    displayName: "Germany",
    slug: "germany",
    flag: "🇩🇪",
    region: "Europe",
    representativeEra: "German Cinema",
    knownFor: "Expressionism, postwar memory, and European auteur cinema",
    description: "Germany connects the catalog to silent-era innovation, modernist film language, postwar memory, and European art cinema.",
    whyMatters: "Germany matters because its film history repeatedly reshaped how cinema visualizes anxiety, history, politics, and modern life.",
    characteristics: ["European cinema anchor", "Silent and modernist influence", "Postwar and historical memory"],
    themes: ["Memory", "Modernity", "Politics", "Identity", "History"],
  },
  fr: {
    displayName: "France",
    slug: "france",
    flag: "🇫🇷",
    region: "Europe",
    representativeEra: "French Cinema",
    knownFor: "Auteur cinema, cinephilia, and New Wave energy",
    description: "France anchors Cinema Atlas in cinephilia, auteur cinema, festival culture, and the idea of film as both popular art and critical language.",
    whyMatters: "France is essential to the catalog because it shaped how world cinema is discussed, curated, preserved, and explored.",
    characteristics: ["Auteur and festival cinema", "Cinephile culture", "Modern film language"],
    themes: ["Love", "Youth", "Modernity", "Art", "Memory"],
  },
  gb: {
    displayName: "United Kingdom",
    slug: "united-kingdom",
    flag: "🇬🇧",
    region: "Europe",
    representativeEra: "British Cinema",
    knownFor: "Literary adaptation, social realism, and genre craft",
    description: "The United Kingdom connects the catalog to literary adaptation, social observation, documentary traditions, and durable genre filmmaking.",
    whyMatters: "The United Kingdom adds a major English-language cinema tradition with its own industrial, regional, and artistic identity.",
    characteristics: ["English-language cinema tradition", "Social realism", "Genre and literary adaptation"],
    themes: ["Class", "History", "Identity", "Society", "Memory"],
  },
  hk: {
    displayName: "Hong Kong",
    slug: "hong-kong",
    flag: "🇭🇰",
    region: "East Asia",
    representativeEra: "Hong Kong Cinema",
    knownFor: "Action, urban longing, and international genre influence",
    description: "Hong Kong links Cinema Atlas to a compact but globally influential cinema culture shaped by action, melodrama, urban space, and hybrid identity.",
    whyMatters: "Hong Kong matters because its filmmakers changed the rhythm, style, and emotional vocabulary of global genre cinema.",
    characteristics: ["Global action cinema influence", "Urban atmosphere", "Hybrid cultural identity"],
    themes: ["City", "Longing", "Identity", "Time", "Movement"],
  },
  it: {
    displayName: "Italy",
    slug: "italy",
    flag: "🇮🇹",
    region: "Europe",
    representativeEra: "Italian Cinema",
    knownFor: "Festival culture, neorealism, and auteur cinema",
    description: "Italy is an essential country in world cinema, connected to neorealism, auteur filmmaking, major festivals, and the international circulation of film culture.",
    whyMatters: "Italy matters to Cinema Atlas through its films, directors, and institutions such as the Venice Film Festival.",
    characteristics: ["European auteur and festival cinema", "National cinema and global film history", "Neorealism and modernist influence"],
    themes: ["Festival Culture", "Auteur Cinema", "European Cinema", "Film History"],
  },
  jp: {
    displayName: "Japan",
    slug: "japan",
    flag: "🇯🇵",
    region: "East Asia",
    representativeEra: "Japanese Golden Age",
    knownFor: "Humanism, genre range, and auteur cinema",
    description: "Japan connects Cinema Atlas to one of world cinema's strongest auteur traditions, from classical humanism to animation and contemporary genre work.",
    whyMatters: "Japan matters because its filmmakers helped define how world cinema thinks about truth, family, morality, genre, and visual form.",
    characteristics: ["Strong auteur tradition", "Classical and modern genre range", "Global influence on film language"],
    themes: ["Truth", "Morality", "Family", "Tradition", "Modernity"],
  },
  kr: {
    displayName: "South Korea",
    slug: "korea",
    flag: "🇰🇷",
    region: "East Asia",
    representativeEra: "Korean Contemporary Cinema",
    knownFor: "Genre precision and social commentary",
    description: "South Korea connects Cinema Atlas to contemporary genre cinema, class critique, family stories, and a globally visible modern film culture.",
    whyMatters: "South Korea matters because its films show how popular storytelling can carry sharp social observation and international cinematic energy.",
    characteristics: ["Genre and social commentary", "Class and family structures", "Contemporary global influence"],
    themes: ["Class", "Family", "Capitalism", "Urban Life", "Social Anxiety"],
  },
  tw: {
    displayName: "Taiwan",
    slug: "taiwan",
    flag: "🇹🇼",
    region: "East Asia",
    representativeEra: "Taiwanese Cinema",
    knownFor: "Modern life, memory, and slow cinema",
    description: "Taiwan connects the catalog to New Taiwanese Cinema, memory, urban change, and a precise attention to everyday time.",
    whyMatters: "Taiwan matters because its filmmakers expanded modern art cinema's sense of duration, place, and historical memory.",
    characteristics: ["New Taiwanese Cinema", "Urban and historical memory", "Modern art cinema influence"],
    themes: ["Memory", "City", "Family", "Time", "Modernity"],
  },
  us: {
    displayName: "United States",
    slug: "united-states",
    flag: "🇺🇸",
    region: "North America",
    representativeEra: "New Hollywood",
    knownFor: "Studio systems, genre cinema, and popular mythmaking",
    description: "The United States connects Cinema Atlas to Hollywood, independent film, genre storytelling, star systems, and the global circulation of popular cinema.",
    whyMatters: "The United States is a major catalog anchor because its film industry shaped global film language, distribution, genre, and moviegoing culture.",
    characteristics: ["Studio and independent traditions", "Genre cinema", "Global distribution influence"],
    themes: ["Power", "Family", "American Myth", "Crime", "Individualism"],
  },
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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function staticDirectorByName(name: string): Director | undefined {
  const key = normalizeName(name);
  return staticDirectors.find((director) => normalizeName(director.name) === key);
}

function staticActorByName(name: string): Actor | undefined {
  const key = normalizeName(name);
  return staticActors.find((actor) => normalizeName(actor.name) === key);
}

function staticCountryByName(name: string): Country | undefined {
  const key = normalizeName(name);
  return staticCountries.find((country) => normalizeName(country.name) === key);
}

export class CatalogQueryService {
  private readonly repository = new PostgresCatalogRepository();
  private metrics: QueryMetrics = {
    queryCalls: 0,
    repositoryReads: 0,
    graphReads: 0,
  };

  async getMovies(): Promise<Movie[]> {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;

    if (!hasDatabaseUrl()) return staticMovies;

    try {
      const records = await this.repository.listMovies();
      return Promise.all(records.map((record) => this.mapCatalogMovie(record)));
    } catch {
      return staticMovies;
    }
  }

  async getMovieBySlug(slug: string): Promise<Movie | undefined> {
    const movies = await this.getMovies();
    return movies.find((movie) => movie.id === slug || movie.slug === slug);
  }

  async getDirectors(): Promise<Director[]> {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;

    if (!hasDatabaseUrl()) return staticDirectors;

    try {
      const people = await this.listPeopleByRole("director");
      const movies = await this.getMovies();
      return people.map((person) => this.mapDirectorProjection(person, movies));
    } catch {
      return staticDirectors;
    }
  }

  async getDirectorBySlug(slug: string): Promise<Director | undefined> {
    const directors = await this.getDirectors();
    return directors.find((director) => director.slug === slug);
  }

  async getActors(): Promise<Actor[]> {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;

    if (!hasDatabaseUrl()) return staticActors;

    try {
      const people = await this.listPeopleByRole("actor");
      const movies = await this.getMovies();
      return people.map((person) => this.mapActorProjection(person, movies));
    } catch {
      return staticActors;
    }
  }

  async getActorBySlug(slug: string): Promise<Actor | undefined> {
    const actors = await this.getActors();
    return actors.find((actor) => actor.slug === slug);
  }

  async getCountries(): Promise<Country[]> {
    this.metrics.queryCalls += 1;
    this.metrics.repositoryReads += 1;

    if (!hasDatabaseUrl()) return staticCountries;

    try {
      const rows = await this.listCatalogCountries();
      return rows.map((row) => this.mapCountryProjection(row));
    } catch {
      return staticCountries;
    }
  }

  async getCountryBySlug(slug: string): Promise<Country | undefined> {
    const countries = await this.getCountries();
    return countries.find((country) => country.slug === slug);
  }

  async getDirectorFilmography(directorSlug: string): Promise<Movie[]> {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    const movies = await this.getMovies();
    return movies.filter((movie) => unique([movie.directorSlug, ...(movie.directorIds ?? [])]).includes(directorSlug));
  }

  async getCountryMovies(countrySlug: string): Promise<Movie[]> {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    const movies = await this.getMovies();
    return movies.filter((movie) => unique([movie.countrySlug, ...(movie.countryIds ?? [])]).includes(countrySlug));
  }

  async getActorFilmography(actorSlug: string): Promise<Movie[]> {
    this.metrics.queryCalls += 1;
    this.metrics.graphReads += 1;
    const movies = await this.getMovies();
    return movies.filter((movie) => unique([...(movie.actorIds ?? []), ...movie.actorSlugs]).includes(actorSlug));
  }

  async getMoviesByGenre(genreId: string): Promise<Movie[]> {
    const movies = await this.getMovies();
    return movies.filter((movie) =>
      unique([movie.genre, ...(movie.genreIds ?? []), ...(movie.genres ?? [])])
        .map((value) => value.toLowerCase())
        .includes(genreId.toLowerCase()),
    );
  }

  async getMoviesByLanguage(languageId: string): Promise<Movie[]> {
    const movies = await this.getMovies();
    return movies.filter((movie) =>
      unique([movie.language, ...(movie.languageIds ?? [])])
        .map((value) => value.toLowerCase())
        .includes(languageId.toLowerCase()),
    );
  }

  async getMoviesByCompany(companyId: string): Promise<Movie[]> {
    const movies = await this.getMovies();
    return movies.filter((movie) => (movie.productionCompanyIds ?? []).includes(companyId));
  }

  async getRelatedMovies(movieSlug: string): Promise<Movie[]> {
    const movie = await this.getMovieBySlug(movieSlug);
    if (!movie) return [];
    const movies = await this.getMovies();
    const relatedIds = new Set(movie.relatedMovieIds ?? []);
    movies.forEach((candidate) => {
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
      .map((id) => movies.find((candidate) => candidate.id === id))
      .filter((item): item is Movie => Boolean(item));
  }

  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = { queryCalls: 0, repositoryReads: 0, graphReads: 0 };
  }

  private async mapCatalogMovie(record: CatalogMovieRecord): Promise<Movie> {
    const edges = await this.repository.getRelationsFrom("movie", record.id);
    const directorEdges = edges.filter((edge) => edge.relationType === "MOVIE_DIRECTED_BY_PERSON");
    const actorEdges = edges.filter((edge) => edge.relationType === "MOVIE_ACTED_BY_PERSON");
    const countryEdges = edges.filter((edge) => edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY");
    const genreEdges = edges.filter((edge) => edge.relationType === "MOVIE_HAS_GENRE");
    const languageEdges = edges.filter((edge) => edge.relationType === "MOVIE_USES_LANGUAGE");
    const companyEdges = edges.filter((edge) => edge.relationType === "MOVIE_PRODUCED_BY_COMPANY");

    const directorName = await this.personName(directorEdges[0]?.targetId) ?? "Unknown Director";
    const directorSlug = slugify(directorName) || directorEdges[0]?.targetId || "unknown-director";
    const actorPeople = await Promise.all(actorEdges.slice(0, 5).map((edge) => this.personName(edge.targetId)));
    const actorNames = actorPeople.map((name, index) => name ?? actorEdges[index]?.targetId ?? "Unknown Actor");
    const actorSlugs = actorNames.map((name) => slugify(name));
    const countryId = countryEdges[0]?.targetId ?? record.externalMetadata.productionCountryIds?.[0] ?? "unknown";
    const countryProjection = countryEditorialProjections[countryId.toLowerCase()];
    const countrySlug = countryProjection?.slug ?? countryIdToLegacySlug[countryId] ?? countryId;
    const country = countryProjection?.displayName ?? await this.countryName(countryId) ?? countryId.toUpperCase();
    const genreIds = genreEdges.map((edge) => edge.targetId.replace(/^genre-/, "").replace(/^genre_/, ""));
    const genres = genreIds.map((id) => genreNames[id] ?? id);
    const languageIds = languageEdges.map((edge) => edge.targetId);
    const language = languageNames[languageIds[0] ?? ""] ?? languageIds[0] ?? "Unknown";
    const externalMetadata = this.mapExternalMetadata(record);

    return {
      id: record.id,
      slug: record.slug ?? record.id,
      externalIds: record.externalIds,
      title: record.title,
      originalTitle: record.originalTitle ?? record.title,
      releaseDate: record.releaseDate,
      year: record.year ?? 0,
      runtime: record.runtime ?? 0,
      country,
      countryIds: unique([countrySlug, countryId]),
      countrySlug,
      countryFlag: countryProjection?.flag ?? "",
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
      averageRating: record.externalMetadata.externalRating,
      externalRating: record.externalMetadata.externalRating,
      rating: record.externalMetadata.externalRating
        ? Number((record.externalMetadata.externalRating / 2).toFixed(1))
        : 0,
      whyMatters:
        "This approved catalog record is available through the Cinema Atlas repository-backed canonical query layer.",
      synopsis: record.externalMetadata.overview,
      themes: genres.slice(0, 4),
      style: [],
      historicalContext: ["Imported through the provider-neutral catalog pipeline."],
      relatedMovieIds: [],
      recommendedMovieIds: [],
      productionCompanyIds: companyEdges.map((edge) => edge.targetId),
      poster: "",
      posterPath: record.externalMetadata.poster?.path,
      backdrop: "",
      backdropPath: record.externalMetadata.backdrop?.path,
      externalMetadata,
    };
  }

  private mapExternalMetadata(record: CatalogMovieRecord): MovieExternalMetadata | undefined {
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

  private mapDirectorProjection(person: PersonRow, movies: Movie[]): Director {
    const name = person.display_name ?? person.id;
    const slug = slugify(name) || person.id;
    const fallback = staticDirectorByName(name);
    const filmography = movies.filter((movie) => movie.directorSlug === slug || movie.directorIds?.includes(person.id));
    const firstMovie = filmography[0];
    const country = firstMovie?.country ?? fallback?.country ?? "Catalog";
    const countrySlug = firstMovie?.countrySlug ?? fallback?.countrySlug ?? "catalog";

    return {
      slug,
      name,
      nameKo: name,
      country,
      countrySlug,
      countryFlag: firstMovie?.countryFlag ?? fallback?.countryFlag ?? "",
      birthYear: fallback?.birthYear ?? 0,
      deathYear: fallback?.deathYear,
      description: `${name} is a director represented in the Cinema Atlas canonical catalog.`,
      styleKeywords: ["Canonical Catalog", "Director"],
      knownForMovieIds: filmography.map((movie) => movie.id),
      whyMatters: `${name} is connected to ${filmography.length} catalog film${filmography.length === 1 ? "" : "s"}.`,
      signatureStyle: ["Repository-backed director projection."],
      keyThemes: ["Cinema Atlas Catalog"],
      essentialMovieIds: fallback?.essentialMovieIds ?? filmography.slice(0, 3).map((movie) => movie.id),
      starterMovieId: fallback?.starterMovieId ?? firstMovie?.id,
      startingPointReason: "Start with the first connected catalog film.",
      influencedByDirectorSlugs: fallback?.influencedByDirectorSlugs,
      influencedDirectorSlugs: fallback?.influencedDirectorSlugs,
      relatedDirectorSlugs: fallback?.relatedDirectorSlugs,
    };
  }

  private mapActorProjection(person: PersonRow, movies: Movie[]): Actor {
    const name = person.display_name ?? person.id;
    const slug = slugify(name) || person.id;
    const fallback = staticActorByName(name);
    const filmography = movies.filter((movie) => movie.actorSlugs.includes(slug) || movie.actorIds?.includes(person.id));
    const firstMovie = filmography[0];

    return {
      slug,
      name,
      nameKo: name,
      countrySlug: fallback?.countrySlug ?? firstMovie?.countrySlug ?? "catalog",
      birthYear: fallback?.birthYear ?? 0,
      deathYear: fallback?.deathYear,
      description: `${name} is an actor represented in the Cinema Atlas canonical catalog.`,
      whyMatters: `${name} is connected to ${filmography.length} catalog film${filmography.length === 1 ? "" : "s"}.`,
      screenPersona: ["Canonical Catalog Performer"],
      keyRoles: ["Repository-backed actor projection"],
      essentialMovieIds: fallback?.essentialMovieIds ?? filmography.slice(0, 3).map((movie) => movie.id),
      starterMovieId: fallback?.starterMovieId ?? firstMovie?.id ?? "",
      startingPointReason: "Start with the first connected catalog film.",
      frequentDirectorSlugs: fallback?.frequentDirectorSlugs,
    };
  }

  private mapCountryProjection(row: CountryRow): Country {
    const id = row.id.toLowerCase();
    const editorial = countryEditorialProjections[id];
    const fallback = staticCountries.find((country) => countrySlugToCatalogId[country.slug] === id) ??
      staticCountryByName(editorial?.displayName ?? row.display_name ?? id);
    const name = editorial?.displayName ??
      (row.display_name && row.display_name.length > 2 ? row.display_name : fallback?.name) ??
      id.toUpperCase();
    const slug = editorial?.slug ?? fallback?.slug ?? countryIdToLegacySlug[id] ?? slugify(name) ?? id;

    return {
      slug,
      name,
      displayName: name,
      isoCode: row.iso_code ?? id.toUpperCase(),
      nameKo: name,
      flag: editorial?.flag ?? fallback?.flag ?? "",
      region: editorial?.region ?? fallback?.region ?? "Catalog Region",
      representativeEra: editorial?.representativeEra ?? fallback?.representativeEra ?? "Canonical Catalog",
      knownFor: editorial?.knownFor ?? fallback?.knownFor ?? "Catalog Cinema",
      description: editorial?.description ?? fallback?.description ?? `${name} is represented in the Cinema Atlas canonical catalog.`,
      whyMatters: editorial?.whyMatters ?? fallback?.whyMatters ?? `${name} connects films, people, and catalog relationships.`,
      characteristics: editorial?.characteristics ?? fallback?.characteristics ?? ["Repository-backed country projection."],
      themes: editorial?.themes ?? fallback?.themes ?? ["Cinema Atlas Catalog"],
      essentialMovieIds: fallback?.essentialMovieIds ?? [],
      starterMovieId: fallback?.starterMovieId ?? "",
      startingPointReason: fallback?.startingPointReason ?? "No curated starting point selected yet.",
      directorSlugs: fallback?.directorSlugs ?? [],
      movementSlugs: fallback?.movementSlugs ?? [],
    };
  }

  private async personName(personId?: string): Promise<string | undefined> {
    if (!personId) return undefined;
    const row = await this.repository.getEntityById("person", personId) as PersonRow | undefined;
    return row?.display_name;
  }

  private async countryName(countryId?: string): Promise<string | undefined> {
    if (!countryId) return undefined;
    const normalizedId = countryId.toLowerCase();
    const editorial = countryEditorialProjections[normalizedId];
    if (editorial) return editorial.displayName;

    const row = await this.repository.getEntityById("country", countryId) as CountryRow | undefined;
    return row?.display_name && row.display_name.length > 2 ? row.display_name : undefined;
  }

  private async listPeopleByRole(role: "director" | "actor"): Promise<PersonRow[]> {
    const movies = await this.repository.listMovies();
    const peopleIds = new Set<string>();

    for (const movie of movies) {
      const edges = await this.repository.getRelationsFrom("movie", movie.id);
      edges
        .filter((edge) =>
          role === "director"
            ? edge.relationType === "MOVIE_DIRECTED_BY_PERSON"
            : edge.relationType === "MOVIE_ACTED_BY_PERSON",
        )
        .forEach((edge) => peopleIds.add(edge.targetId));
    }

    const rows = await Promise.all(
      [...peopleIds].map((id) => this.repository.getEntityById("person", id) as Promise<PersonRow | undefined>),
    );

    return rows
      .filter((row): row is PersonRow => Boolean(row))
      .sort((a, b) => (a.display_name ?? a.id).localeCompare(b.display_name ?? b.id));
  }

  private async listCatalogCountries(): Promise<CountryRow[]> {
    const movies = await this.repository.listMovies();
    const countryIds = new Set<string>();

    for (const movie of movies) {
      const edges = await this.repository.getRelationsFrom("movie", movie.id);
      edges
        .filter((edge): edge is KnowledgeGraphEdge => edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY")
        .forEach((edge) => countryIds.add(edge.targetId));
    }

    const rows = await Promise.all(
      [...countryIds].map((id) => this.repository.getEntityById("country", id) as Promise<CountryRow | undefined>),
    );

    return rows
      .filter((row): row is CountryRow => Boolean(row))
      .sort((a, b) => (a.display_name ?? a.id).localeCompare(b.display_name ?? b.id));
  }
}

export const catalogQueryService = new CatalogQueryService();

export const getMovies = () => catalogQueryService.getMovies();
export const getMovieBySlug = (slug: string) => catalogQueryService.getMovieBySlug(slug);
export const getDirectors = () => catalogQueryService.getDirectors();
export const getDirectorBySlug = (slug: string) => catalogQueryService.getDirectorBySlug(slug);
export const getActors = () => catalogQueryService.getActors();
export const getActorBySlug = (slug: string) => catalogQueryService.getActorBySlug(slug);
export const getCountries = () => catalogQueryService.getCountries();
export const getCountryBySlug = (slug: string) => catalogQueryService.getCountryBySlug(slug);
export const getDirectorFilmography = (directorId: string) => catalogQueryService.getDirectorFilmography(directorId);
export const getCountryMovies = (countryId: string) => catalogQueryService.getCountryMovies(countryId);
export const getActorFilmography = (actorId: string) => catalogQueryService.getActorFilmography(actorId);
export const getMoviesByGenre = (genreId: string) => catalogQueryService.getMoviesByGenre(genreId);
export const getMoviesByLanguage = (languageId: string) => catalogQueryService.getMoviesByLanguage(languageId);
export const getMoviesByCompany = (companyId: string) => catalogQueryService.getMoviesByCompany(companyId);
export const getRelatedMovies = (movieId: string) => catalogQueryService.getRelatedMovies(movieId);

export const listMovies = () => staticMovies;
export const listMoviesAsync = getMovies;
export const getMovieById = (id: string) => staticMovies.find((movie) => movie.id === id || movie.slug === id);
export const getMovieByIdAsync = getMovieBySlug;
export const getDirectorFilmographyAsync = getDirectorFilmography;
export const getCountryMoviesAsync = getCountryMovies;





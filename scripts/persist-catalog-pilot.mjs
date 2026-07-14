import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const inputRoot = path.join(repoRoot, "data", "imports", "tmdb-pilot-100");
const outputRoot = path.join(repoRoot, "data", "imports", "catalog-persistence-pilot");
const pipelineVersion = "catalog-persistence-v1";
const contentQualityThreshold = 90;
const pilotLimit = 10;

function stableHash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function stableMovieId(draft) {
  if (draft.externalIds?.imdbId) {
    return `mov_${stableHash(`imdb:${draft.externalIds.imdbId}`)}`;
  }
  if (draft.externalIds?.wikidataId) {
    return `mov_${stableHash(`wikidata:${draft.externalIds.wikidataId}`)}`;
  }
  return `mov_${stableHash(`${draft.title}:${draft.year ?? "unknown"}`)}`;
}

function stableEntityId(type, value) {
  return `${type}_${stableHash(String(value))}`;
}

function nowIso() {
  return new Date().toISOString();
}

function provenance(providerRecordId, importedAt) {
  return {
    provider: "tmdb",
    providerRecordId,
    importedAt,
    pipelineVersion,
  };
}

function edgeId(edge) {
  return [
    edge.sourceType,
    edge.sourceId,
    edge.relationType,
    edge.targetType,
    edge.targetId,
  ].join(":");
}

class PilotRepository {
  constructor() {
    this.moviesById = new Map();
    this.moviesByTmdbId = new Map();
    this.moviesByImdbId = new Map();
    this.moviesByWikidataId = new Map();
    this.entities = {
      people: new Map(),
      countries: new Map(),
      genres: new Map(),
      languages: new Map(),
      companies: new Map(),
    };
    this.edgesById = new Map();
    this.outgoingEdgesByEntity = new Map();
    this.incomingEdgesByEntity = new Map();
  }

  findMovie(record) {
    if (record.externalIds.tmdbId && this.moviesByTmdbId.has(record.externalIds.tmdbId)) {
      return this.moviesById.get(this.moviesByTmdbId.get(record.externalIds.tmdbId));
    }
    if (record.externalIds.imdbId && this.moviesByImdbId.has(record.externalIds.imdbId)) {
      return this.moviesById.get(this.moviesByImdbId.get(record.externalIds.imdbId));
    }
    if (record.externalIds.wikidataId && this.moviesByWikidataId.has(record.externalIds.wikidataId)) {
      return this.moviesById.get(this.moviesByWikidataId.get(record.externalIds.wikidataId));
    }
    return this.moviesById.get(record.id);
  }

  saveApprovedMovieTransaction({ movie, entities, edges }) {
    const existing = this.findMovie(movie);
    const record = existing
      ? { ...movie, id: existing.id, createdAt: existing.createdAt }
      : movie;

    this.moviesById.set(record.id, record);
    if (record.externalIds.tmdbId) {
      this.moviesByTmdbId.set(record.externalIds.tmdbId, record.id);
    }
    if (record.externalIds.imdbId) {
      this.moviesByImdbId.set(record.externalIds.imdbId, record.id);
    }
    if (record.externalIds.wikidataId) {
      this.moviesByWikidataId.set(record.externalIds.wikidataId, record.id);
    }

    entities.people.forEach((entity) => this.entities.people.set(entity.id, entity));
    entities.countries.forEach((entity) => this.entities.countries.set(entity.id, entity));
    entities.genres.forEach((entity) => this.entities.genres.set(entity.id, entity));
    entities.languages.forEach((entity) => this.entities.languages.set(entity.id, entity));
    entities.companies.forEach((entity) => this.entities.companies.set(entity.id, entity));

    edges.forEach((edge) => {
      const storedEdge = { ...edge, sourceId: record.id };
      const id = edgeId(storedEdge);
      storedEdge.id = id;
      this.edgesById.set(id, storedEdge);

      const outgoingKey = `${storedEdge.sourceType}:${storedEdge.sourceId}`;
      const incomingKey = `${storedEdge.targetType}:${storedEdge.targetId}`;
      if (!this.outgoingEdgesByEntity.has(outgoingKey)) {
        this.outgoingEdgesByEntity.set(outgoingKey, new Set());
      }
      if (!this.incomingEdgesByEntity.has(incomingKey)) {
        this.incomingEdgesByEntity.set(incomingKey, new Set());
      }
      this.outgoingEdgesByEntity.get(outgoingKey).add(id);
      this.incomingEdgesByEntity.get(incomingKey).add(id);
    });

    return record;
  }

  getRelationsFrom(sourceType, sourceId) {
    const ids = this.outgoingEdgesByEntity.get(`${sourceType}:${sourceId}`) ?? new Set();
    return [...ids].map((id) => this.edgesById.get(id)).filter(Boolean);
  }

  getRelationsTo(targetType, targetId) {
    const ids = this.incomingEdgesByEntity.get(`${targetType}:${targetId}`) ?? new Set();
    return [...ids].map((id) => this.edgesById.get(id)).filter(Boolean);
  }

  snapshot() {
    return {
      movies: [...this.moviesById.values()],
      entities: Object.fromEntries(
        Object.entries(this.entities).map(([key, value]) => [key, [...value.values()]]),
      ),
      edges: [...this.edgesById.values()],
    };
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function createMovieRecord(draft, quality) {
  const importedAt = nowIso();
  return {
    id: stableMovieId(draft),
    legacyDraftId: draft.id,
    externalIds: draft.externalIds,
    title: draft.title,
    originalTitle: draft.originalTitle,
    releaseDate: draft.releaseDate,
    year: draft.year,
    runtime: draft.runtime,
    externalMetadata: draft.externalMetadata,
    approval: {
      state: "APPROVED",
      reason: `Pipeline ${quality.pipelineStatus}; content quality ${quality.contentQualityScore}.`,
      approvedAt: importedAt,
      approvedBy: "catalog-persistence-pilot",
    },
    provenance: [provenance(String(draft.externalIds.tmdbId ?? draft.id), importedAt)],
    createdAt: importedAt,
    updatedAt: importedAt,
  };
}

function createEdge(sourceId, relationType, targetType, targetId, providerRecordId) {
  const timestamp = nowIso();
  return {
    id: "",
    sourceType: "movie",
    sourceId,
    relationType,
    targetType,
    targetId,
    provenance: provenance(providerRecordId, timestamp),
    confidence: "high",
    isCurated: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createRecords(draft, rawRecord, quality) {
  const movie = createMovieRecord(draft, quality);
  const providerRecordId = String(rawRecord.providerMovieId);
  const peopleById = new Map();
  const countries = draft.countryIds.map((id) => ({
    id,
    provenance: [provenance(providerRecordId, movie.createdAt)],
  }));
  const genres = draft.genreIds.map((id) => ({
    id: stableEntityId("genre", id),
    externalIds: { sourceIds: { tmdbGenreId: id } },
    provenance: [provenance(providerRecordId, movie.createdAt)],
  }));
  const languages = draft.languageIds.map((id) => ({
    id,
    provenance: [provenance(providerRecordId, movie.createdAt)],
  }));
  const companies = draft.productionCompanyIds.map((id) => ({
    id: stableEntityId("company", id),
    externalIds: { sourceIds: { tmdbCompanyId: id } },
    provenance: [provenance(providerRecordId, movie.createdAt)],
  }));
  const edges = [];

  rawRecord.credits
    ?.filter((credit) => ["director", "writer", "actor", "producer"].includes(credit.role))
    .forEach((credit) => {
      const personId = stableEntityId("person", credit.externalPersonId ?? credit.name);
      const roles = new Set(peopleById.get(personId)?.roles ?? []);
      roles.add(credit.role);
      peopleById.set(personId, {
        id: personId,
        name: credit.name,
        externalIds: credit.externalIds,
        roles: [...roles],
        provenance: [provenance(providerRecordId, movie.createdAt)],
      });

      const relationType =
        credit.role === "director"
          ? "MOVIE_DIRECTED_BY_PERSON"
          : credit.role === "writer"
            ? "MOVIE_WRITTEN_BY_PERSON"
            : credit.role === "producer"
              ? "MOVIE_PRODUCED_BY_COMPANY"
              : "MOVIE_ACTED_BY_PERSON";

      if (credit.role !== "producer") {
        edges.push(createEdge(movie.id, relationType, "person", personId, providerRecordId));
      }
    });

  countries.forEach((country) =>
    edges.push(
      createEdge(movie.id, "MOVIE_PRODUCED_IN_COUNTRY", "country", country.id, providerRecordId),
    ),
  );
  genres.forEach((genre) =>
    edges.push(createEdge(movie.id, "MOVIE_HAS_GENRE", "genre", genre.id, providerRecordId)),
  );
  languages.forEach((language) =>
    edges.push(createEdge(movie.id, "MOVIE_USES_LANGUAGE", "language", language.id, providerRecordId)),
  );
  companies.forEach((company) =>
    edges.push(
      createEdge(movie.id, "MOVIE_PRODUCED_BY_COMPANY", "company", company.id, providerRecordId),
    ),
  );

  return {
    movie,
    entities: {
      people: [...peopleById.values()],
      countries,
      genres,
      languages,
      companies,
    },
    edges,
  };
}

async function main() {
  const drafts = await readJson(path.join(inputRoot, "canonical", "canonical-movie-drafts.json"));
  const rawRecords = await readJson(path.join(inputRoot, "raw", "external-movie-records.json"));
  const qualityReport = await readJson(path.join(inputRoot, "reports", "quality-report.json"));

  const approvedQuality = qualityReport
    .filter(
      (row) =>
        row.pipelineStatus === "PASS" &&
        row.contentQualityScore >= contentQualityThreshold &&
        !row.reviewRequired,
    )
    .slice(0, pilotLimit);

  const unresolved = qualityReport.filter(
    (row) => row.pipelineStatus !== "PASS" || row.reviewRequired,
  );

  const repository = new PilotRepository();

  const approvedInputs = approvedQuality.map((quality) => {
    const draft = drafts.find((item) => String(item.externalIds.tmdbId) === quality.providerMovieId);
    const rawRecord = rawRecords.find((item) => item.providerMovieId === quality.providerMovieId);
    if (!draft || !rawRecord) {
      throw new Error(`Missing draft or raw record for ${quality.movie}`);
    }
    return createRecords(draft, rawRecord, quality);
  });

  approvedInputs.forEach((input) => repository.saveApprovedMovieTransaction(input));
  const firstSnapshot = repository.snapshot();
  approvedInputs.forEach((input) => repository.saveApprovedMovieTransaction(input));
  const secondSnapshot = repository.snapshot();

  const firstMovie = secondSnapshot.movies[0];
  const firstDirectorEdge = secondSnapshot.edges.find(
    (edge) =>
      edge.sourceId === firstMovie.id && edge.relationType === "MOVIE_DIRECTED_BY_PERSON",
  );
  const firstCountryEdge = secondSnapshot.edges.find(
    (edge) =>
      edge.sourceId === firstMovie.id && edge.relationType === "MOVIE_PRODUCED_IN_COUNTRY",
  );
  const queryVerification = {
    movieConnections: repository.getRelationsFrom("movie", firstMovie.id).length,
    directorFilmography: firstDirectorEdge
      ? repository.getRelationsTo("person", firstDirectorEdge.targetId).length
      : 0,
    countryFilms: firstCountryEdge
      ? repository.getRelationsTo("country", firstCountryEdge.targetId).length
      : 0,
  };

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(
    path.join(outputRoot, "movies.json"),
    JSON.stringify(secondSnapshot.movies, null, 2),
  );
  await fs.writeFile(
    path.join(outputRoot, "entities.json"),
    JSON.stringify(secondSnapshot.entities, null, 2),
  );
  await fs.writeFile(
    path.join(outputRoot, "edges.json"),
    JSON.stringify(secondSnapshot.edges, null, 2),
  );
  await fs.writeFile(
    path.join(outputRoot, "provenance.json"),
    JSON.stringify(
      secondSnapshot.movies.map((movie) => ({
        movieId: movie.id,
        externalIds: movie.externalIds,
        approval: movie.approval,
        provenance: movie.provenance,
      })),
      null,
      2,
    ),
  );
  await fs.writeFile(
    path.join(outputRoot, "unresolved.json"),
    JSON.stringify(unresolved, null, 2),
  );

  const summary = {
    pilot: "catalog-persistence-pilot",
    source: "tmdb-pilot-100",
    contentQualityThreshold,
    approvedInputCount: approvedInputs.length,
    movieRecords: secondSnapshot.movies.length,
    entityRecords: Object.values(secondSnapshot.entities).reduce(
      (total, records) => total + records.length,
      0,
    ),
    edgeRecords: secondSnapshot.edges.length,
    unresolvedInputCount: unresolved.length,
    reimport: {
      movieRecordsBefore: firstSnapshot.movies.length,
      movieRecordsAfter: secondSnapshot.movies.length,
      edgeRecordsBefore: firstSnapshot.edges.length,
      edgeRecordsAfter: secondSnapshot.edges.length,
      duplicateMoviesCreated: secondSnapshot.movies.length - firstSnapshot.movies.length,
      duplicateEdgesCreated: secondSnapshot.edges.length - firstSnapshot.edges.length,
    },
    queryVerification,
  };

  await fs.writeFile(path.join(outputRoot, "summary.json"), JSON.stringify(summary, null, 2));
  console.table([summary]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


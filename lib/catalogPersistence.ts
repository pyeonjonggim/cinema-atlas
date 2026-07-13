import type {
  CatalogCompanyRecord,
  CatalogCountryRecord,
  CatalogGenreRecord,
  CatalogLanguageRecord,
  CatalogMovieRecord,
  CatalogPersonRecord,
  CatalogRepository,
  CatalogRepositoryTransactionInput,
  EntityMatchCandidate,
  KnowledgeGraphEdge,
  KnowledgeGraphEntityType,
  KnowledgeGraphRelationType,
} from "@/types/catalogPersistence";

function entityKey(type: KnowledgeGraphEntityType, id: string): string {
  return `${type}:${id}`;
}

function edgeKey(edge: Pick<KnowledgeGraphEdge, "sourceType" | "sourceId" | "relationType" | "targetType" | "targetId">): string {
  return [
    edge.sourceType,
    edge.sourceId,
    edge.relationType,
    edge.targetType,
    edge.targetId,
  ].join(":");
}

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly moviesById = new Map<string, CatalogMovieRecord>();
  private readonly moviesByTmdbId = new Map<number, string>();
  private readonly moviesByImdbId = new Map<string, string>();
  private readonly moviesByWikidataId = new Map<string, string>();
  private readonly peopleById = new Map<string, CatalogPersonRecord>();
  private readonly countriesById = new Map<string, CatalogCountryRecord>();
  private readonly genresById = new Map<string, CatalogGenreRecord>();
  private readonly languagesById = new Map<string, CatalogLanguageRecord>();
  private readonly companiesById = new Map<string, CatalogCompanyRecord>();
  private readonly edgesById = new Map<string, KnowledgeGraphEdge>();
  private readonly outgoingEdgesByEntity = new Map<string, Set<string>>();
  private readonly incomingEdgesByEntity = new Map<string, Set<string>>();
  private readonly edgesByRelationType = new Map<KnowledgeGraphRelationType, Set<string>>();

  async getMovieById(id: string): Promise<CatalogMovieRecord | undefined> {
    return this.moviesById.get(id);
  }

  async getMovieByExternalId(
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<CatalogMovieRecord | undefined> {
    const id =
      provider === "tmdb"
        ? this.moviesByTmdbId.get(Number(value))
        : provider === "imdb"
          ? this.moviesByImdbId.get(String(value))
          : this.moviesByWikidataId.get(String(value));

    return id ? this.moviesById.get(id) : undefined;
  }

  async createMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord> {
    if (this.moviesById.has(movie.id)) {
      throw new Error(`Movie already exists: ${movie.id}`);
    }

    this.storeMovie(movie);
    return movie;
  }

  async updateMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord> {
    if (!this.moviesById.has(movie.id)) {
      throw new Error(`Movie does not exist: ${movie.id}`);
    }

    this.storeMovie(movie);
    return movie;
  }

  async upsertMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord> {
    const existing =
      (movie.externalIds.tmdbId
        ? await this.getMovieByExternalId("tmdb", movie.externalIds.tmdbId)
        : undefined) ??
      (movie.externalIds.imdbId
        ? await this.getMovieByExternalId("imdb", movie.externalIds.imdbId)
        : undefined) ??
      (movie.externalIds.wikidataId
        ? await this.getMovieByExternalId("wikidata", movie.externalIds.wikidataId)
        : undefined) ??
      this.moviesById.get(movie.id);

    const record = existing ? { ...movie, id: existing.id, createdAt: existing.createdAt } : movie;
    this.storeMovie(record);
    return record;
  }

  async listMovies(): Promise<CatalogMovieRecord[]> {
    return [...this.moviesById.values()];
  }

  async saveEntity(
    record:
      | CatalogPersonRecord
      | CatalogCountryRecord
      | CatalogGenreRecord
      | CatalogLanguageRecord
      | CatalogCompanyRecord,
  ): Promise<void> {
    if ("roles" in record) {
      this.peopleById.set(record.id, record);
      return;
    }

    if (record.id.length === 2) {
      this.countriesById.set(record.id, record);
      return;
    }

    if (record.id.startsWith("company-")) {
      this.companiesById.set(record.id, record);
      return;
    }

    if (record.id.startsWith("genre-")) {
      this.genresById.set(record.id, record);
      return;
    }

    this.languagesById.set(record.id, record);
  }

  async saveRelations(edges: KnowledgeGraphEdge[]): Promise<void> {
    edges.forEach((edge) => this.storeEdge(edge));
  }

  async saveApprovedMovieTransaction(
    input: CatalogRepositoryTransactionInput,
  ): Promise<CatalogMovieRecord> {
    const movie = await this.upsertMovie(input.movie);
    const edgeMovieId = movie.id;

    [
      ...input.entities.people,
      ...input.entities.countries,
      ...input.entities.genres,
      ...input.entities.languages,
      ...input.entities.companies,
    ].forEach((entity) => {
      void this.saveEntity(entity);
    });

    await this.saveRelations(
      input.edges.map((edge) => ({
        ...edge,
        sourceId: edge.sourceType === "movie" ? edgeMovieId : edge.sourceId,
      })),
    );

    return movie;
  }

  async getRelationsFrom(
    sourceType: KnowledgeGraphEntityType,
    sourceId: string,
  ): Promise<KnowledgeGraphEdge[]> {
    const ids = this.outgoingEdgesByEntity.get(entityKey(sourceType, sourceId)) ?? new Set();
    return [...ids].map((id) => this.edgesById.get(id)).filter(Boolean) as KnowledgeGraphEdge[];
  }

  async getRelationsTo(
    targetType: KnowledgeGraphEntityType,
    targetId: string,
  ): Promise<KnowledgeGraphEdge[]> {
    const ids = this.incomingEdgesByEntity.get(entityKey(targetType, targetId)) ?? new Set();
    return [...ids].map((id) => this.edgesById.get(id)).filter(Boolean) as KnowledgeGraphEdge[];
  }

  async findEntityCandidates(
    entityType: KnowledgeGraphEntityType,
    label: string,
  ): Promise<EntityMatchCandidate[]> {
    if (entityType !== "person" && entityType !== "country") {
      return [];
    }

    const normalized = label.trim().toLowerCase();
    const candidates =
      entityType === "person"
        ? [...this.peopleById.values()]
        : entityType === "country"
          ? [...this.countriesById.values()]
          : [];

    return candidates
      .filter((candidate) => ("name" in candidate ? candidate.name?.toLowerCase() === normalized : false))
      .map((candidate) => ({
        entityType,
        entityId: candidate.id,
        label: "name" in candidate ? candidate.name ?? candidate.id : candidate.id,
        confidence: "exact",
        matchReason: "normalized label match",
      }));
  }

  getEdgesByRelationType(relationType: KnowledgeGraphRelationType): KnowledgeGraphEdge[] {
    const ids = this.edgesByRelationType.get(relationType) ?? new Set();
    return [...ids].map((id) => this.edgesById.get(id)).filter(Boolean) as KnowledgeGraphEdge[];
  }

  snapshot() {
    return {
      movies: [...this.moviesById.values()],
      entities: {
        people: [...this.peopleById.values()],
        countries: [...this.countriesById.values()],
        genres: [...this.genresById.values()],
        languages: [...this.languagesById.values()],
        companies: [...this.companiesById.values()],
      },
      edges: [...this.edgesById.values()],
    };
  }

  private storeMovie(movie: CatalogMovieRecord): void {
    this.moviesById.set(movie.id, movie);
    if (movie.externalIds.tmdbId) {
      this.moviesByTmdbId.set(movie.externalIds.tmdbId, movie.id);
    }
    if (movie.externalIds.imdbId) {
      this.moviesByImdbId.set(movie.externalIds.imdbId, movie.id);
    }
    if (movie.externalIds.wikidataId) {
      this.moviesByWikidataId.set(movie.externalIds.wikidataId, movie.id);
    }
  }

  private storeEdge(edge: KnowledgeGraphEdge): void {
    const id = edgeKey(edge);
    const storedEdge = { ...edge, id };
    this.edgesById.set(id, storedEdge);

    const outgoingKey = entityKey(storedEdge.sourceType, storedEdge.sourceId);
    const incomingKey = entityKey(storedEdge.targetType, storedEdge.targetId);

    if (!this.outgoingEdgesByEntity.has(outgoingKey)) {
      this.outgoingEdgesByEntity.set(outgoingKey, new Set());
    }
    if (!this.incomingEdgesByEntity.has(incomingKey)) {
      this.incomingEdgesByEntity.set(incomingKey, new Set());
    }
    if (!this.edgesByRelationType.has(storedEdge.relationType)) {
      this.edgesByRelationType.set(storedEdge.relationType, new Set());
    }

    this.outgoingEdgesByEntity.get(outgoingKey)?.add(id);
    this.incomingEdgesByEntity.get(incomingKey)?.add(id);
    this.edgesByRelationType.get(storedEdge.relationType)?.add(id);
  }
}

export async function getConnectedEntities(
  repository: CatalogRepository,
  sourceType: KnowledgeGraphEntityType,
  sourceId: string,
): Promise<KnowledgeGraphEdge[]> {
  return repository.getRelationsFrom(sourceType, sourceId);
}

export async function getMovieConnections(
  repository: CatalogRepository,
  movieId: string,
): Promise<KnowledgeGraphEdge[]> {
  return getConnectedEntities(repository, "movie", movieId);
}

export async function getRelatedMovies(
  repository: CatalogRepository,
  movieId: string,
): Promise<string[]> {
  const movieEdges = await repository.getRelationsFrom("movie", movieId);
  const related = await Promise.all(
    movieEdges.map((edge) => repository.getRelationsTo(edge.targetType, edge.targetId)),
  );

  return [
    ...new Set(
      related
        .flat()
        .filter((edge) => edge.sourceType === "movie" && edge.sourceId !== movieId)
        .map((edge) => edge.sourceId),
    ),
  ];
}

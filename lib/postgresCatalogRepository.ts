import "server-only";

import type { Pool, PoolClient, QueryResultRow } from "pg";

import { getPostgresPool } from "@/lib/db/postgres";
import { RelationshipRepository } from "@/lib/relationships/relationshipRepository";
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
} from "@/types/catalogPersistence";
import type { EntityAlias, ResolvableEntityType } from "@/types/entityResolution";
import type { RelationshipEdge, RelationshipEntityType } from "@/types/relationship";

type PgExecutor = Pool | PoolClient;

type CatalogMovieRow = QueryResultRow & {
  id: string;
  slug?: string;
  title: string;
  original_title?: string;
  release_date?: Date | string;
  release_year?: number;
  runtime?: number;
  external_metadata: CatalogMovieRecord["externalMetadata"];
  approval_state: CatalogMovieRecord["approval"]["state"];
  approval_reason?: string;
  approved_at?: Date | string;
  approved_by?: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function isoDate(value?: Date | string): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function externalIdRows(
  entityType: string,
  entityId: string,
  externalIds?: Record<string, unknown>,
) {
  if (!externalIds) return [];

  const rows: Array<{
    id: string;
    provider: "tmdb" | "imdb" | "wikidata" | "custom";
    providerEntityId?: string;
    externalKey: string;
    externalValue: string;
  }> = [];

  if (externalIds.tmdbId) {
    rows.push({
      id: `${entityType}:${entityId}:tmdb:tmdbId:${externalIds.tmdbId}`,
      provider: "tmdb",
      providerEntityId: String(externalIds.tmdbId),
      externalKey: "tmdbId",
      externalValue: String(externalIds.tmdbId),
    });
  }
  if (externalIds.imdbId) {
    rows.push({
      id: `${entityType}:${entityId}:imdb:imdbId:${externalIds.imdbId}`,
      provider: "imdb",
      providerEntityId: String(externalIds.imdbId),
      externalKey: "imdbId",
      externalValue: String(externalIds.imdbId),
    });
  }
  if (externalIds.wikidataId) {
    rows.push({
      id: `${entityType}:${entityId}:wikidata:wikidataId:${externalIds.wikidataId}`,
      provider: "wikidata",
      providerEntityId: String(externalIds.wikidataId),
      externalKey: "wikidataId",
      externalValue: String(externalIds.wikidataId),
    });
  }

  return rows;
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

export class PostgresCatalogRepository implements CatalogRepository {
  private readonly relationshipRepository: RelationshipRepository;

  constructor(private readonly pool: Pool = getPostgresPool()) {
    this.relationshipRepository = new RelationshipRepository(pool);
  }

  async getMovieById(id: string): Promise<CatalogMovieRecord | undefined> {
    const result = await this.pool.query<CatalogMovieRow>(
      "SELECT * FROM catalog_movies WHERE id = $1",
      [id],
    );
    return result.rows[0] ? this.mapMovieRow(result.rows[0]) : undefined;
  }

  async getMovieBySlug(slug: string): Promise<CatalogMovieRecord | undefined> {
    const result = await this.pool.query<CatalogMovieRow>(
      "SELECT * FROM catalog_movies WHERE slug = $1 LIMIT 1",
      [slug],
    );
    return result.rows[0] ? this.mapMovieRow(result.rows[0]) : undefined;
  }

  async getPersonByDisplaySlug(
    role: "director" | "actor",
    slug: string,
  ): Promise<unknown | undefined> {
    const result = await this.pool.query(
      `SELECT *
       FROM catalog_people
       WHERE roles ? $1
         AND regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g') = $2
       LIMIT 1`,
      [role, slug],
    );
    return result.rows[0];
  }

  async getCountryByDisplaySlug(slug: string): Promise<unknown | undefined> {
    const result = await this.pool.query(
      `SELECT *
       FROM catalog_countries
       WHERE id = $1
          OR regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g') = $1
       LIMIT 1`,
      [slug],
    );
    return result.rows[0];
  }

  async getMovieByExternalId(
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<CatalogMovieRecord | undefined> {
    const result = await this.pool.query<CatalogMovieRow>(
      `SELECT m.*
       FROM catalog_movies m
       INNER JOIN catalog_external_ids e ON e.entity_type = 'movie' AND e.entity_id = m.id
       WHERE e.provider = $1 AND e.external_value = $2
       LIMIT 1`,
      [provider, String(value)],
    );
    return result.rows[0] ? this.mapMovieRow(result.rows[0]) : undefined;
  }

  async createMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord> {
    const existing = await this.getMovieById(movie.id);
    if (existing) {
      throw new Error(`Movie already exists: ${movie.id}`);
    }
    await this.upsertMovie(movie);
    return movie;
  }

  async updateMovie(movie: CatalogMovieRecord): Promise<CatalogMovieRecord> {
    const existing = await this.getMovieById(movie.id);
    if (!existing) {
      throw new Error(`Movie does not exist: ${movie.id}`);
    }
    await this.upsertMovie(movie);
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
        : undefined);

    const record = existing ? { ...movie, id: existing.id, createdAt: existing.createdAt } : movie;
    await this.upsertMovieWithExecutor(this.pool, record);
    await this.saveExternalIdsWithExecutor(this.pool, "movie", record.id, record.externalIds);
    return record;
  }

  async listMovies(): Promise<CatalogMovieRecord[]> {
    const result = await this.pool.query<CatalogMovieRow>(
      "SELECT * FROM catalog_movies ORDER BY release_year NULLS LAST, title",
    );
    return result.rows.map((row) => this.mapMovieRow(row));
  }

  async getMoviesByIds(ids: string[]): Promise<CatalogMovieRecord[]> {
    if (ids.length === 0) return [];

    const result = await this.pool.query<CatalogMovieRow>(
      `SELECT *
       FROM catalog_movies
       WHERE id = ANY($1::text[])
       ORDER BY release_year NULLS LAST, title`,
      [ids],
    );
    return result.rows.map((row) => this.mapMovieRow(row));
  }

  async saveEntity(
    record:
      | CatalogPersonRecord
      | CatalogCountryRecord
      | CatalogGenreRecord
      | CatalogLanguageRecord
      | CatalogCompanyRecord,
  ): Promise<void> {
    await this.saveEntityWithExecutor(this.pool, record);
  }

  async saveRelations(edges: KnowledgeGraphEdge[]): Promise<void> {
    await Promise.all(edges.map((edge) => this.upsertEdgeWithExecutor(this.pool, edge)));
  }

  async saveApprovedMovieTransaction(
    input: CatalogRepositoryTransactionInput,
  ): Promise<CatalogMovieRecord> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const movie = await this.upsertMovieInTransaction(client, input.movie);
      const entities = [
        ...input.entities.people,
        ...input.entities.countries,
        ...input.entities.genres,
        ...input.entities.languages,
        ...input.entities.companies,
      ];

      for (const entity of entities) {
        await this.saveEntityWithExecutor(client, entity);
      }

      for (const edge of input.edges) {
        await this.upsertEdgeWithExecutor(client, {
          ...edge,
          sourceId: edge.sourceType === "movie" ? movie.id : edge.sourceId,
        });
      }

      await client.query("COMMIT");
      return movie;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getRelationsFrom(
    sourceType: KnowledgeGraphEntityType,
    sourceId: string,
  ): Promise<KnowledgeGraphEdge[]> {
    const result = await this.relationshipRepository.findOutgoing({
      type: this.toRelationshipEntityType(sourceType),
      id: sourceId,
    });
    return result.edges.map((edge) => this.mapRelationshipEdge(edge));
  }

  async getRelationsFromSources(
    sourceType: KnowledgeGraphEntityType,
    sourceIds: string[],
  ): Promise<KnowledgeGraphEdge[]> {
    if (sourceIds.length === 0) return [];

    const result = await this.relationshipRepository.findOutgoing(
      sourceIds.map((sourceId) => ({
        type: this.toRelationshipEntityType(sourceType),
        id: sourceId,
      })),
    );
    return result.edges.map((edge) => this.mapRelationshipEdge(edge));
  }

  async getRelationsTo(
    targetType: KnowledgeGraphEntityType,
    targetId: string,
  ): Promise<KnowledgeGraphEdge[]> {
    const result = await this.relationshipRepository.findIncoming({
      type: this.toRelationshipEntityType(targetType),
      id: targetId,
    });
    return result.edges.map((edge) => this.mapRelationshipEdge(edge));
  }

  async getEntitiesByIds(
    entityType: ResolvableEntityType,
    ids: string[],
  ): Promise<unknown[]> {
    if (ids.length === 0) return [];

    const table = this.tableForEntityType(entityType);
    const result = await this.pool.query(
      `SELECT *
       FROM ${table}
       WHERE id = ANY($1::text[])`,
      [ids],
    );
    return result.rows;
  }

  async listPeopleByRole(role: "director" | "actor"): Promise<unknown[]> {
    const relationType =
      role === "director" ? "MOVIE_DIRECTED_BY_PERSON" : "MOVIE_ACTED_BY_PERSON";
    const relations = await this.relationshipRepository.findByType(relationType, {
      sourceEntityTypes: ["MOVIE"],
      targetEntityTypes: ["PERSON"],
    });
    const personIds = [...new Set(relations.edges.map((edge) => edge.targetId))];
    if (personIds.length === 0) return [];

    const result = await this.pool.query(
      `SELECT *
       FROM catalog_people
       WHERE id = ANY($1::text[])
       ORDER BY display_name`,
      [personIds],
    );
    return result.rows;
  }

  async listPeopleWithMovieIdsByRole(role: "director" | "actor"): Promise<unknown[]> {
    const relationType =
      role === "director" ? "MOVIE_DIRECTED_BY_PERSON" : "MOVIE_ACTED_BY_PERSON";
    const result = await this.pool.query(
      `WITH role_edges AS (
        SELECT
          target_id,
          ARRAY_AGG(source_id ORDER BY source_id) AS movie_ids
        FROM knowledge_graph_edges
        WHERE relation_type = $1
          AND source_type = 'movie'
          AND target_type = 'person'
        GROUP BY target_id
      )
      SELECT p.*, role_edges.movie_ids
      FROM catalog_people p
      INNER JOIN role_edges ON role_edges.target_id = p.id
      WHERE p.roles ? $2
      ORDER BY p.display_name`,
      [relationType, role],
    );
    return result.rows;
  }

  async listCountriesReferencedByMovies(): Promise<unknown[]> {
    const relations = await this.relationshipRepository.findByType("MOVIE_PRODUCED_IN_COUNTRY", {
      sourceEntityTypes: ["MOVIE"],
      targetEntityTypes: ["COUNTRY"],
    });
    const countryIds = [...new Set(relations.edges.map((edge) => edge.targetId))];
    if (countryIds.length === 0) return [];

    const result = await this.pool.query(
      `SELECT *
       FROM catalog_countries
       WHERE id = ANY($1::text[])
       ORDER BY display_name`,
      [countryIds],
    );
    return result.rows;
  }

  async countMoviesByCountry(): Promise<Array<{ country_id: string; movie_count: string }>> {
    const result = await this.pool.query(
      `SELECT target_id AS country_id, COUNT(DISTINCT source_id)::text AS movie_count
       FROM knowledge_graph_edges
       WHERE relation_type = 'MOVIE_PRODUCED_IN_COUNTRY'
         AND source_type = 'movie'
         AND target_type = 'country'
       GROUP BY target_id
       ORDER BY target_id`,
    );
    return result.rows;
  }

  async findEntityCandidates(
    entityType: KnowledgeGraphEntityType,
    label: string,
  ): Promise<EntityMatchCandidate[]> {
    if (entityType !== "person" && entityType !== "country") return [];

    const table = entityType === "person" ? "catalog_people" : "catalog_countries";
    const field = entityType === "person" ? "display_name" : "display_name";
    const result = await this.pool.query(
      `SELECT id, ${field} AS label FROM ${table} WHERE LOWER(${field}) = LOWER($1)`,
      [label],
    );

    return result.rows.map((row) => ({
      entityType,
      entityId: String(row.id),
      label: String(row.label),
      confidence: "exact",
      matchReason: "normalized label match",
    }));
  }

  async getEntityById(
    entityType: ResolvableEntityType,
    id: string,
  ): Promise<unknown | undefined> {
    const table = this.tableForEntityType(entityType);
    const result = await this.pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async getEntityByExternalId(
    entityType: ResolvableEntityType,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<unknown | undefined> {
    const result = await this.pool.query(
      `SELECT entity_id
       FROM catalog_external_ids
       WHERE entity_type = $1 AND provider = $2 AND external_value = $3
       LIMIT 1`,
      [entityType, provider, String(value)],
    );
    return result.rows[0] ? this.getEntityById(entityType, String(result.rows[0].entity_id)) : undefined;
  }

  async findEntitiesByNormalizedName(
    entityType: ResolvableEntityType,
    normalizedName: string,
  ): Promise<EntityMatchCandidate[]> {
    const table = this.tableForEntityType(entityType);
    const field = entityType === "person" ? "display_name" : "display_name";
    const result = await this.pool.query(
      `SELECT id, ${field} AS label FROM ${table} WHERE LOWER(${field}) = LOWER($1)`,
      [normalizedName],
    );
    return result.rows.map((row) => this.toCandidate(entityType, row, "normalized name"));
  }

  async findEntitiesByAlias(
    entityType: ResolvableEntityType,
    normalizedAlias: string,
  ): Promise<EntityMatchCandidate[]> {
    const result = await this.pool.query(
      `SELECT entity_id AS id, value AS label
       FROM catalog_aliases
       WHERE entity_type = $1 AND normalized_value = $2`,
      [entityType, normalizedAlias],
    );
    return result.rows.map((row) => this.toCandidate(entityType, row, "alias"));
  }

  async listEntityCandidates(entityType: ResolvableEntityType): Promise<EntityMatchCandidate[]> {
    const table = this.tableForEntityType(entityType);
    const field = entityType === "person" ? "display_name" : "display_name";
    const result = await this.pool.query(`SELECT id, ${field} AS label FROM ${table} LIMIT 100`);
    return result.rows.map((row) => this.toCandidate(entityType, row, "listed candidate"));
  }

  async saveEntityAlias(
    entityType: ResolvableEntityType,
    entityId: string,
    alias: EntityAlias,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO catalog_aliases (
        id, entity_type, entity_id, value, normalized_value, language, script,
        alias_type, provenance, is_preferred, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (entity_type, entity_id, normalized_value) DO NOTHING`,
      [
        `${entityType}:${entityId}:alias:${alias.normalizedValue}`,
        entityType,
        entityId,
        alias.value,
        alias.normalizedValue,
        alias.language,
        alias.script,
        alias.aliasType,
        JSON.stringify(alias.provenance),
        alias.isPreferred,
        alias.createdAt,
      ],
    );
  }

  async reserveExternalId(
    entityType: ResolvableEntityType,
    entityId: string,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<void> {
    const result = await this.pool.query(
      `SELECT entity_id FROM catalog_external_ids
       WHERE entity_type = $1 AND provider = $2 AND external_value = $3`,
      [entityType, provider, String(value)],
    );
    const conflict = result.rows.find((row) => row.entity_id !== entityId);
    if (conflict) {
      throw new Error(`External ID conflict: ${entityType}:${provider}:${value}`);
    }
  }

  private async upsertMovieInTransaction(
    client: PoolClient,
    movie: CatalogMovieRecord,
  ): Promise<CatalogMovieRecord> {
    const existing =
      (movie.externalIds.tmdbId
        ? await this.getMovieByExternalIdInTransaction(client, "tmdb", movie.externalIds.tmdbId)
        : undefined) ??
      (movie.externalIds.imdbId
        ? await this.getMovieByExternalIdInTransaction(client, "imdb", movie.externalIds.imdbId)
        : undefined) ??
      (movie.externalIds.wikidataId
        ? await this.getMovieByExternalIdInTransaction(client, "wikidata", movie.externalIds.wikidataId)
        : undefined);
    const record = existing ? { ...movie, id: existing.id, createdAt: existing.createdAt } : movie;
    await this.upsertMovieWithExecutor(client, record);
    await this.saveExternalIdsWithExecutor(client, "movie", record.id, record.externalIds);
    return record;
  }

  private async getMovieByExternalIdInTransaction(
    client: PoolClient,
    provider: "tmdb" | "imdb" | "wikidata",
    value: string | number,
  ): Promise<CatalogMovieRecord | undefined> {
    const result = await client.query<CatalogMovieRow>(
      `SELECT m.*
       FROM catalog_movies m
       INNER JOIN catalog_external_ids e ON e.entity_type = 'movie' AND e.entity_id = m.id
       WHERE e.provider = $1 AND e.external_value = $2
       LIMIT 1`,
      [provider, String(value)],
    );
    return result.rows[0] ? this.mapMovieRow(result.rows[0]) : undefined;
  }

  private async upsertMovieWithExecutor(
    executor: PgExecutor,
    movie: CatalogMovieRecord,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO catalog_movies (
        id, slug, title, original_title, release_date, release_year, runtime,
        overview, original_language, poster_path, backdrop_path, external_metadata,
        approval_state, approval_reason, approved_at, approved_by, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        original_title = EXCLUDED.original_title,
        release_date = EXCLUDED.release_date,
        release_year = EXCLUDED.release_year,
        runtime = EXCLUDED.runtime,
        overview = EXCLUDED.overview,
        original_language = EXCLUDED.original_language,
        poster_path = EXCLUDED.poster_path,
        backdrop_path = EXCLUDED.backdrop_path,
        external_metadata = EXCLUDED.external_metadata,
        approval_state = EXCLUDED.approval_state,
        approval_reason = EXCLUDED.approval_reason,
        approved_at = EXCLUDED.approved_at,
        approved_by = EXCLUDED.approved_by,
        updated_at = EXCLUDED.updated_at`,
      [
        movie.id,
        movie.slug,
        movie.title,
        movie.originalTitle,
        movie.releaseDate,
        movie.year,
        movie.runtime,
        movie.externalMetadata.overview,
        movie.externalMetadata.spokenLanguageIds?.[0],
        movie.externalMetadata.poster?.path,
        movie.externalMetadata.backdrop?.path,
        JSON.stringify(movie.externalMetadata),
        movie.approval.state,
        movie.approval.reason,
        movie.approval.approvedAt,
        movie.approval.approvedBy,
        movie.createdAt,
        movie.updatedAt,
      ],
    );
  }

  private async saveEntityWithExecutor(
    executor: PgExecutor,
    record:
      | CatalogPersonRecord
      | CatalogCountryRecord
      | CatalogGenreRecord
      | CatalogLanguageRecord
      | CatalogCompanyRecord,
  ): Promise<void> {
    if ("roles" in record) {
      await executor.query(
        `INSERT INTO catalog_people (id, display_name, roles, provenance)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          roles = EXCLUDED.roles,
          provenance = EXCLUDED.provenance,
          updated_at = NOW()`,
        [record.id, record.name, JSON.stringify(record.roles), JSON.stringify(record.provenance)],
      );
      await this.saveExternalIdsWithExecutor(executor, "person", record.id, record.externalIds);
      return;
    }

    if (record.id.length === 2) {
      await executor.query(
        `INSERT INTO catalog_countries (id, iso_code, display_name, provenance)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
          iso_code = EXCLUDED.iso_code,
          display_name = EXCLUDED.display_name,
          provenance = EXCLUDED.provenance,
          updated_at = NOW()`,
        [record.id, record.id.toUpperCase(), record.name ?? record.id.toUpperCase(), JSON.stringify(record.provenance)],
      );
      await this.saveExternalIdsWithExecutor(executor, "country", record.id, record.externalIds);
      return;
    }

    if (record.id.startsWith("company-")) {
      await executor.query(
        `INSERT INTO catalog_companies (id, display_name, provenance, external_ids)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          provenance = EXCLUDED.provenance,
          external_ids = EXCLUDED.external_ids,
          updated_at = NOW()`,
        [record.id, record.name ?? record.id, JSON.stringify(record.provenance), JSON.stringify(record.externalIds ?? {})],
      );
      await this.saveExternalIdsWithExecutor(executor, "company", record.id, record.externalIds);
      return;
    }

    if (record.id.startsWith("genre-")) {
      await executor.query(
        `INSERT INTO catalog_genres (id, display_name, provenance, external_ids)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          provenance = EXCLUDED.provenance,
          external_ids = EXCLUDED.external_ids,
          updated_at = NOW()`,
        [record.id, record.name ?? record.id, JSON.stringify(record.provenance), JSON.stringify(record.externalIds ?? {})],
      );
      await this.saveExternalIdsWithExecutor(executor, "genre", record.id, record.externalIds);
      return;
    }

    await executor.query(
      `INSERT INTO catalog_languages (id, iso_code, display_name, provenance, external_ids)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
        iso_code = EXCLUDED.iso_code,
        display_name = EXCLUDED.display_name,
        provenance = EXCLUDED.provenance,
        external_ids = EXCLUDED.external_ids,
        updated_at = NOW()`,
      [record.id, record.id, record.name ?? record.id, JSON.stringify(record.provenance), JSON.stringify(record.externalIds ?? {})],
    );
    await this.saveExternalIdsWithExecutor(executor, "language", record.id, record.externalIds);
  }

  private async saveExternalIdsWithExecutor(
    executor: PgExecutor,
    entityType: string,
    entityId: string,
    externalIds?: Record<string, unknown>,
  ): Promise<void> {
    for (const row of externalIdRows(entityType, entityId, externalIds)) {
      await executor.query(
        `INSERT INTO catalog_external_ids (
          id, entity_type, entity_id, provider, provider_entity_id, external_key, external_value
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (entity_type, provider, external_key, external_value) DO UPDATE SET
          entity_id = EXCLUDED.entity_id,
          provider_entity_id = EXCLUDED.provider_entity_id`,
        [
          row.id,
          entityType,
          entityId,
          row.provider,
          row.providerEntityId,
          row.externalKey,
          row.externalValue,
        ],
      );
    }
  }

  private async upsertEdgeWithExecutor(
    executor: PgExecutor,
    edge: KnowledgeGraphEdge,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO knowledge_graph_edges (
        id, source_type, source_id, relation_type, target_type, target_id,
        provenance, confidence, is_curated, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (source_type, source_id, relation_type, target_type, target_id) DO UPDATE SET
        provenance = EXCLUDED.provenance,
        confidence = EXCLUDED.confidence,
        is_curated = EXCLUDED.is_curated,
        updated_at = EXCLUDED.updated_at`,
      [
        edge.id || edgeKey(edge),
        edge.sourceType,
        edge.sourceId,
        edge.relationType,
        edge.targetType,
        edge.targetId,
        JSON.stringify(edge.provenance),
        edge.confidence,
        edge.isCurated,
        edge.createdAt,
        edge.updatedAt,
      ],
    );
  }

  private mapMovieRow(row: CatalogMovieRow): CatalogMovieRecord {
    return {
      id: row.id,
      slug: row.slug,
      externalIds: {},
      title: row.title,
      originalTitle: row.original_title,
      releaseDate: row.release_date ? String(row.release_date).slice(0, 10) : undefined,
      year: row.release_year,
      runtime: row.runtime,
      externalMetadata: row.external_metadata,
      approval: {
        state: row.approval_state,
        reason: row.approval_reason,
        approvedAt: isoDate(row.approved_at),
        approvedBy: row.approved_by,
      },
      provenance: [],
      createdAt: isoDate(row.created_at) ?? new Date().toISOString(),
      updatedAt: isoDate(row.updated_at) ?? new Date().toISOString(),
    };
  }

  private mapRelationshipEdge(edge: RelationshipEdge): KnowledgeGraphEdge {
    return {
      id: edge.id,
      sourceType: edge.persistedSourceType as KnowledgeGraphEdge["sourceType"],
      sourceId: edge.sourceId,
      relationType: edge.type as KnowledgeGraphEdge["relationType"],
      targetType: edge.persistedTargetType as KnowledgeGraphEdge["targetType"],
      targetId: edge.targetId,
      provenance: {
        provider: edge.isCurated ? "cinema-atlas-editorial" : edge.provenance.source === "TMDB" ? "tmdb" : "system-derived",
        providerRecordId: edge.provenance.providerRecordId,
        importedAt: edge.provenance.importedAt ?? edge.createdAt ?? new Date().toISOString(),
        pipelineVersion: edge.provenance.pipelineVersion ?? "relationship-repository-v1",
      },
      confidence: String(edge.metadata?.confidence ?? (edge.isCurated ? "editorial-confirmed" : "high")) as KnowledgeGraphEdge["confidence"],
      isCurated: edge.isCurated,
      createdAt: edge.createdAt ?? new Date().toISOString(),
      updatedAt: edge.updatedAt ?? new Date().toISOString(),
    };
  }

  private toRelationshipEntityType(entityType: KnowledgeGraphEntityType): RelationshipEntityType {
    return entityType.toUpperCase().replace(/-/g, "_") as RelationshipEntityType;
  }

  private tableForEntityType(entityType: ResolvableEntityType): string {
    if (entityType === "person") return "catalog_people";
    if (entityType === "country") return "catalog_countries";
    if (entityType === "genre") return "catalog_genres";
    if (entityType === "language") return "catalog_languages";
    return "catalog_companies";
  }

  private toCandidate(
    entityType: ResolvableEntityType,
    row: QueryResultRow,
    matchReason: string,
  ): EntityMatchCandidate {
    return {
      entityType: entityType === "company" ? "production-company" : entityType,
      entityId: String(row.id),
      label: String(row.label ?? row.id),
      confidence: "high",
      matchReason,
    };
  }
}

import "server-only";

import type { Pool, QueryResultRow } from "pg";

import { getPostgresPool } from "@/lib/db/postgres";
import type { AwardEditorialEntity, EditorialEntity, EditorialEntityBase, MovementEditorialEntity } from "@/lib/editorial/entity";
import type { EditorialEntityKind, EditorialEntitySourceType, EditorialEntityStatus } from "@/lib/editorial/metadata";
import type { EditorialRepository } from "@/lib/editorial/repository";

type MovementRow = QueryResultRow & {
  id: string;
  slug: string;
  name: string;
  description: string;
  why_it_matters?: string;
  status: EditorialEntityStatus;
  source_type: EditorialEntitySourceType;
  revision: number;
  era_label?: string;
  start_year?: number;
  end_year?: number;
  characteristics: string[];
  themes: string[];
  starter_movie_slug?: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type AwardRow = QueryResultRow & {
  id: string;
  slug: string;
  name: string;
  description: string;
  why_it_matters?: string;
  status: EditorialEntityStatus;
  source_type: EditorialEntitySourceType;
  revision: number;
  organization?: string;
  award_type?: string;
  country_slug?: string;
  founded_year?: number;
  overview: string[];
  starter_movie_slug?: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type RelationRow = QueryResultRow & {
  relation_type: string;
  target_type: string;
  target_id: string;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function relationId(kind: EditorialEntityKind, slug: string, relationType: string, targetType: string, targetId: string) {
  return [kind, slug, relationType, targetType, targetId].join(":");
}

function edgeRelation(kind: EditorialEntityKind, targetType: string): string {
  if (kind === "movement" && targetType === "movie") return "MOVIE_PART_OF_MOVEMENT";
  if (kind === "award" && targetType === "movie") return "MOVIE_WON_AWARD";
  if (targetType === "director") return "MOVIE_DIRECTED_BY_PERSON";
  if (targetType === "country") return "MOVIE_PRODUCED_IN_COUNTRY";
  return "MOVIE_RELATED_TO_JOURNEY";
}

export class PostgresEditorialRepository implements EditorialRepository<EditorialEntity> {
  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async findAllPublished(input?: { kind?: EditorialEntityKind }): Promise<EditorialEntity[]> {
    if (input?.kind === "movement") {
      const result = await this.pool.query<MovementRow>("SELECT * FROM catalog_movements WHERE status = 'published' ORDER BY name");
      return Promise.all(result.rows.map((row) => this.mapMovementRow(row)));
    }

    if (input?.kind === "award") {
      const result = await this.pool.query<AwardRow>("SELECT * FROM catalog_awards WHERE status = 'published' ORDER BY name");
      return Promise.all(result.rows.map((row) => this.mapAwardRow(row)));
    }

    const [movements, awards] = await Promise.all([
      this.findAllPublished({ kind: "movement" }),
      this.findAllPublished({ kind: "award" }),
    ]);
    return [...movements, ...awards];
  }

  async findBySlug(kind: EditorialEntityKind, slug: string): Promise<EditorialEntity | undefined> {
    if (kind === "movement") {
      const result = await this.pool.query<MovementRow>("SELECT * FROM catalog_movements WHERE slug = $1 LIMIT 1", [slug]);
      return result.rows[0] ? this.mapMovementRow(result.rows[0]) : undefined;
    }

    if (kind === "award") {
      const result = await this.pool.query<AwardRow>("SELECT * FROM catalog_awards WHERE slug = $1 LIMIT 1", [slug]);
      return result.rows[0] ? this.mapAwardRow(result.rows[0]) : undefined;
    }

    return undefined;
  }

  async exists(kind: EditorialEntityKind, slug: string): Promise<boolean> {
    return Boolean(await this.findBySlug(kind, slug));
  }

  async upsert(entity: EditorialEntity): Promise<EditorialEntity> {
    if (entity.kind === "movement") {
      await this.pool.query(
        `INSERT INTO catalog_movements (
          id, slug, name, description, why_it_matters, status, source_type,
          revision, era_label, characteristics, themes, starter_movie_slug,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          why_it_matters = EXCLUDED.why_it_matters,
          status = EXCLUDED.status,
          source_type = EXCLUDED.source_type,
          revision = EXCLUDED.revision,
          era_label = EXCLUDED.era_label,
          characteristics = EXCLUDED.characteristics,
          themes = EXCLUDED.themes,
          starter_movie_slug = EXCLUDED.starter_movie_slug,
          updated_at = EXCLUDED.updated_at`,
        [
          entity.id,
          entity.slug,
          entity.name,
          entity.description,
          entity.whyItMatters,
          entity.status,
          entity.sourceType,
          entity.revision,
          entity.period,
          JSON.stringify(entity.characteristics ?? []),
          JSON.stringify(entity.themes ?? []),
          entity.starterMovieSlug,
          entity.createdAt,
          entity.updatedAt,
        ],
      );
      await this.replaceRelationships(entity);
      return entity;
    }

    if (entity.kind === "award") {
      await this.pool.query(
        `INSERT INTO catalog_awards (
          id, slug, name, description, why_it_matters, status, source_type,
          revision, organization, award_type, country_slug, founded_year,
          overview, starter_movie_slug, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          why_it_matters = EXCLUDED.why_it_matters,
          status = EXCLUDED.status,
          source_type = EXCLUDED.source_type,
          revision = EXCLUDED.revision,
          organization = EXCLUDED.organization,
          award_type = EXCLUDED.award_type,
          country_slug = EXCLUDED.country_slug,
          founded_year = EXCLUDED.founded_year,
          overview = EXCLUDED.overview,
          starter_movie_slug = EXCLUDED.starter_movie_slug,
          updated_at = EXCLUDED.updated_at`,
        [
          entity.id,
          entity.slug,
          entity.name,
          entity.description,
          entity.whyItMatters,
          entity.status,
          entity.sourceType,
          entity.revision,
          entity.organization,
          "Award / Institution",
          entity.countrySlug,
          entity.foundedYear,
          JSON.stringify(entity.overview ?? []),
          entity.starterMovieSlug,
          entity.createdAt,
          entity.updatedAt,
        ],
      );
      await this.replaceRelationships(entity);
      return entity;
    }

    throw new Error("Unsupported editorial entity kind");
  }

  async replaceRelationships(entity: EditorialEntityBase): Promise<void> {
    await this.pool.query(
      "DELETE FROM knowledge_graph_edges WHERE source_type = $1 AND source_id = $2 AND is_curated = true",
      [entity.kind, entity.slug],
    );

    const targets: Array<{ type: "movie" | "director" | "country" | "movement" | "award"; ids: string[] }> = [
      { type: "movie", ids: entity.movieSlugs ?? [] },
      { type: "director", ids: entity.directorSlugs ?? [] },
      { type: "country", ids: entity.countrySlugs ?? [] },
      { type: "movement", ids: entity.relatedEntitySlugs ?? [] },
    ];

    for (const target of targets) {
      for (const targetId of target.ids) {
        const relationType = edgeRelation(entity.kind, target.type);
        await this.pool.query(
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
            relationId(entity.kind, entity.slug, relationType, target.type, targetId),
            entity.kind,
            entity.slug,
            relationType,
            target.type === "director" ? "person" : target.type,
            targetId,
            JSON.stringify({
              provider: "cinema-atlas-editorial",
              providerRecordId: entity.slug,
              importedAt: entity.updatedAt.toISOString(),
              pipelineVersion: "editorial-persistence-v1",
            }),
            "editorial-confirmed",
            true,
            entity.createdAt,
            entity.updatedAt,
          ],
        );
      }
    }
  }

  async delete(kind: EditorialEntityKind, slug: string): Promise<void> {
    if (kind === "movement") await this.pool.query("DELETE FROM catalog_movements WHERE slug = $1", [slug]);
    if (kind === "award") await this.pool.query("DELETE FROM catalog_awards WHERE slug = $1", [slug]);
    await this.pool.query("DELETE FROM knowledge_graph_edges WHERE source_type = $1 AND source_id = $2", [kind, slug]);
  }

  private async mapMovementRow(row: MovementRow): Promise<MovementEditorialEntity> {
    const relationships = await this.relationshipSlugs("movement", row.slug);
    return {
      id: row.id,
      slug: row.slug,
      kind: "movement",
      name: row.name,
      description: row.description,
      whyItMatters: row.why_it_matters,
      status: row.status,
      sourceType: row.source_type,
      revision: row.revision,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
      period: row.era_label,
      characteristics: row.characteristics ?? [],
      themes: row.themes ?? [],
      starterMovieSlug: row.starter_movie_slug,
      ...relationships,
    };
  }

  private async mapAwardRow(row: AwardRow): Promise<AwardEditorialEntity> {
    const relationships = await this.relationshipSlugs("award", row.slug);
    return {
      id: row.id,
      slug: row.slug,
      kind: "award",
      name: row.name,
      description: row.description,
      whyItMatters: row.why_it_matters,
      status: row.status,
      sourceType: row.source_type,
      revision: row.revision,
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
      organization: row.organization,
      countrySlug: row.country_slug,
      foundedYear: row.founded_year,
      overview: row.overview ?? [],
      starterMovieSlug: row.starter_movie_slug,
      ...relationships,
    };
  }

  private async relationshipSlugs(kind: "movement" | "award", slug: string) {
    const result = await this.pool.query<RelationRow>(
      "SELECT relation_type, target_type, target_id FROM knowledge_graph_edges WHERE source_type = $1 AND source_id = $2 AND is_curated = true",
      [kind, slug],
    );

    return {
      movieSlugs: result.rows.filter((row) => row.target_type === "movie").map((row) => row.target_id),
      directorSlugs: result.rows.filter((row) => row.target_type === "person").map((row) => row.target_id),
      countrySlugs: result.rows.filter((row) => row.target_type === "country").map((row) => row.target_id),
      relatedEntitySlugs: result.rows.filter((row) => row.target_type === "movement" || row.target_type === "award").map((row) => row.target_id),
    };
  }
}

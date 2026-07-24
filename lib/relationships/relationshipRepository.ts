import "server-only";

import type { Pool, QueryResultRow } from "pg";

import { getPostgresPool } from "@/lib/db/postgres";
import {
  persistedEntityTypeToCanonical,
  relationshipRegistry,
} from "@/lib/relationships/relationshipRegistry";
import type {
  RelationshipEdge,
  RelationshipEntityReference,
  RelationshipEntityType,
  RelationshipNode,
  RelationshipQueryOptions,
  RelationshipResult,
} from "@/types/relationship";

type EdgeRow = QueryResultRow & {
  id: string;
  source_type: string;
  source_id: string;
  relation_type: string;
  target_type: string;
  target_id: string;
  provenance?: Record<string, unknown>;
  confidence?: string;
  is_curated?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

const canonicalToPersistedEntityType = Object.fromEntries(
  Object.entries(persistedEntityTypeToCanonical).map(([persisted, canonical]) => [canonical, persisted]),
) as Record<RelationshipEntityType, string>;

function isoDate(value?: Date | string): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function canonicalType(value: string): RelationshipEntityType {
  return persistedEntityTypeToCanonical[value.toLowerCase()] ?? (value.toUpperCase() as RelationshipEntityType);
}

function persistedType(value: RelationshipEntityType): string {
  return canonicalToPersistedEntityType[value] ?? value.toLowerCase();
}

function uniqueNodes(edges: RelationshipEdge[]): RelationshipNode[] {
  const nodes = new Map<string, RelationshipNode>();
  for (const edge of edges) {
    nodes.set(`${edge.source.type}:${edge.source.id}`, edge.source);
    nodes.set(`${edge.target.type}:${edge.target.id}`, edge.target);
  }
  return [...nodes.values()];
}

function addArrayFilter(
  clauses: string[],
  params: unknown[],
  column: string,
  values: string[] | undefined,
) {
  if (!values || values.length === 0) return;
  params.push(values);
  clauses.push(`${column} = ANY($${params.length}::text[])`);
}

function addLimit(params: unknown[], limit?: number): string {
  if (!limit || limit < 1) return "";
  params.push(limit);
  return ` LIMIT $${params.length}`;
}

export class RelationshipRepository {
  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async findOutgoing(
    source: RelationshipEntityReference | RelationshipEntityReference[],
    options: RelationshipQueryOptions = {},
  ): Promise<RelationshipResult> {
    const sources = Array.isArray(source) ? source : [source];
    if (sources.length === 0) return { edges: [], nodes: [] };

    const clauses: string[] = [];
    const params: unknown[] = [];
    const sourceTypes = [...new Set(sources.map((item) => persistedType(item.type)))];
    const sourceIds = [...new Set(sources.map((item) => item.id))];
    addArrayFilter(clauses, params, "source_type", sourceTypes);
    addArrayFilter(clauses, params, "source_id", sourceIds);
    this.applyOptions(clauses, params, options);

    return this.queryEdges(clauses, params, options.limit);
  }

  async findIncoming(
    target: RelationshipEntityReference | RelationshipEntityReference[],
    options: RelationshipQueryOptions = {},
  ): Promise<RelationshipResult> {
    const targets = Array.isArray(target) ? target : [target];
    if (targets.length === 0) return { edges: [], nodes: [] };

    const clauses: string[] = [];
    const params: unknown[] = [];
    const targetTypes = [...new Set(targets.map((item) => persistedType(item.type)))];
    const targetIds = [...new Set(targets.map((item) => item.id))];
    addArrayFilter(clauses, params, "target_type", targetTypes);
    addArrayFilter(clauses, params, "target_id", targetIds);
    this.applyOptions(clauses, params, options);

    return this.queryEdges(clauses, params, options.limit);
  }

  async findBetween(
    source: RelationshipEntityReference,
    target: RelationshipEntityReference,
    options: RelationshipQueryOptions = {},
  ): Promise<RelationshipResult> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    params.push(persistedType(source.type), source.id, persistedType(target.type), target.id);
    clauses.push("source_type = $1", "source_id = $2", "target_type = $3", "target_id = $4");
    this.applyOptions(clauses, params, options);

    return this.queryEdges(clauses, params, options.limit);
  }

  async findByType(
    relationshipType: string | string[],
    options: RelationshipQueryOptions = {},
  ): Promise<RelationshipResult> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    addArrayFilter(clauses, params, "relation_type", Array.isArray(relationshipType) ? relationshipType : [relationshipType]);
    this.applyOptions(clauses, params, options);

    return this.queryEdges(clauses, params, options.limit);
  }

  async findNeighbors(
    entity: RelationshipEntityReference,
    options: RelationshipQueryOptions = {},
  ): Promise<RelationshipResult> {
    const direction = options.direction ?? "both";
    if (direction === "outgoing") return this.findOutgoing(entity, options);
    if (direction === "incoming") return this.findIncoming(entity, options);

    const clauses: string[] = [];
    const params: unknown[] = [persistedType(entity.type), entity.id];
    clauses.push("((source_type = $1 AND source_id = $2) OR (target_type = $1 AND target_id = $2))");
    this.applyOptions(clauses, params, options);

    return this.queryEdges(clauses, params, options.limit);
  }

  registeredRelationshipTypes(): string[] {
    return relationshipRegistry.map((definition) => definition.key);
  }

  private applyOptions(
    clauses: string[],
    params: unknown[],
    options: RelationshipQueryOptions,
  ) {
    addArrayFilter(clauses, params, "relation_type", options.relationshipTypes);
    addArrayFilter(
      clauses,
      params,
      "source_type",
      options.sourceEntityTypes?.map(persistedType),
    );
    addArrayFilter(
      clauses,
      params,
      "target_type",
      options.targetEntityTypes?.map(persistedType),
    );
  }

  private async queryEdges(
    clauses: string[],
    params: unknown[],
    limit?: number,
  ): Promise<RelationshipResult> {
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await this.pool.query<EdgeRow>(
      `SELECT id, source_type, source_id, relation_type, target_type, target_id,
              provenance, confidence, is_curated, created_at, updated_at
       FROM knowledge_graph_edges
       ${where}
       ORDER BY relation_type, source_type, source_id, target_type, target_id${addLimit(params, limit)}`,
      params,
    );
    const edges = result.rows.map((row) => this.mapRow(row));
    return {
      edges,
      nodes: uniqueNodes(edges),
    };
  }

  private mapRow(row: EdgeRow): RelationshipEdge {
    const source = {
      type: canonicalType(row.source_type),
      id: row.source_id,
    };
    const target = {
      type: canonicalType(row.target_type),
      id: row.target_id,
    };

    return {
      id: row.id,
      type: row.relation_type,
      source,
      target,
      sourceType: source.type,
      sourceId: source.id,
      targetType: target.type,
      targetId: target.id,
      persistedSourceType: row.source_type,
      persistedTargetType: row.target_type,
      class: relationshipRegistry.find((definition) => definition.key === row.relation_type)?.relationshipClass ?? "FACTUAL",
      provenance: {
        source: row.is_curated ? "EDITORIAL" : "TMDB",
        providerRecordId: typeof row.provenance?.providerRecordId === "string" ? row.provenance.providerRecordId : undefined,
        importedAt: typeof row.provenance?.importedAt === "string" ? row.provenance.importedAt : undefined,
        pipelineVersion: typeof row.provenance?.pipelineVersion === "string" ? row.provenance.pipelineVersion : undefined,
      },
      metadata: row.confidence ? { confidence: row.confidence } : undefined,
      isCurated: row.is_curated === true,
      createdAt: isoDate(row.created_at),
      updatedAt: isoDate(row.updated_at),
    };
  }
}

import "server-only";

import { relationshipRegistry } from "@/lib/relationships/relationshipRegistry";
import { RelationshipRepository } from "@/lib/relationships/relationshipRepository";
import type {
  RelatedEntity,
  RelationshipEdge,
  RelationshipEntityReference,
  RelationshipGroup,
  RelationshipNode,
  RelationshipQueryOptions,
  RelationshipServiceOptions,
  RelationshipSummary,
} from "@/types/relationship";

function normalizeOptions(options: RelationshipServiceOptions = {}): RelationshipQueryOptions {
  return {
    ...options,
    relationshipTypes: options.relationshipTypes ?? options.preferredRelationshipTypes,
    targetEntityTypes: options.targetEntityTypes ?? options.entityFilters,
    limit: options.limit ?? options.maximumResults,
  };
}

function edgeKey(edge: RelationshipEdge): string {
  return `${edge.source.type}:${edge.source.id}:${edge.type}:${edge.target.type}:${edge.target.id}`;
}

function uniqueEdges(edges: RelationshipEdge[]): RelationshipEdge[] {
  const unique = new Map<string, RelationshipEdge>();
  for (const edge of edges) {
    unique.set(edgeKey(edge), edge);
  }
  return [...unique.values()];
}

function excluded(node: RelationshipNode, excludedEntityIds: string[] | undefined): boolean {
  if (!excludedEntityIds || excludedEntityIds.length === 0) return false;
  return excludedEntityIds.includes(node.id) || excludedEntityIds.includes(`${node.type}:${node.id}`);
}

function relatedEntityFromEdges(
  node: RelationshipNode,
  direction: "outgoing" | "incoming",
  edges: RelationshipEdge[],
): RelatedEntity {
  return {
    ...node,
    direction,
    relationshipCount: edges.length,
    relationshipTypes: [...new Set(edges.map((edge) => edge.type))],
    relationships: edges,
  };
}

function groupEdges(edges: RelationshipEdge[]): RelationshipGroup[] {
  const grouped = new Map<string, RelationshipEdge[]>();
  for (const edge of edges) {
    grouped.set(edge.type, [...(grouped.get(edge.type) ?? []), edge]);
  }

  return [...grouped.entries()].map(([relationshipType, groupEdges]) => ({
    relationshipType,
    edges: groupEdges,
    relatedEntities: relatedEntitiesFromEdges(groupEdges),
  }));
}

function relatedEntitiesFromEdges(edges: RelationshipEdge[]): RelatedEntity[] {
  const grouped = new Map<string, { node: RelationshipNode; direction: "outgoing" | "incoming"; edges: RelationshipEdge[] }>();

  for (const edge of edges) {
    const entries: Array<{ node: RelationshipNode; direction: "outgoing" | "incoming" }> = [
      { node: edge.target, direction: "outgoing" },
      { node: edge.source, direction: "incoming" },
    ];

    for (const entry of entries) {
      const key = `${entry.direction}:${entry.node.type}:${entry.node.id}`;
      const existing = grouped.get(key);
      grouped.set(key, {
        node: entry.node,
        direction: entry.direction,
        edges: [...(existing?.edges ?? []), edge],
      });
    }
  }

  return [...grouped.values()].map((item) =>
    relatedEntityFromEdges(item.node, item.direction, item.edges),
  );
}

function filterRelatedEntities(
  entities: RelatedEntity[],
  options: RelationshipServiceOptions,
): RelatedEntity[] {
  return entities
    .filter((entity) => !excluded(entity, options.excludeEntityIds))
    .filter((entity) => !options.entityFilters || options.entityFilters.includes(entity.type))
    .slice(0, options.maximumResults ?? options.limit);
}

export class RelationshipService {
  constructor(private readonly repository = new RelationshipRepository()) {}

  async getRelatedEntities(
    entity: RelationshipEntityReference,
    options: RelationshipServiceOptions = {},
  ): Promise<RelatedEntity[]> {
    const result = await this.repository.findNeighbors(entity, normalizeOptions(options));
    const entities = relatedEntitiesFromEdges(result.edges).filter(
      (related) => related.id !== entity.id || related.type !== entity.type,
    );
    return filterRelatedEntities(entities, options);
  }

  async getOutgoingRelationships(
    entity: RelationshipEntityReference | RelationshipEntityReference[],
    options: RelationshipServiceOptions = {},
  ): Promise<RelationshipEdge[]> {
    const result = await this.repository.findOutgoing(entity, normalizeOptions(options));
    return uniqueEdges(result.edges);
  }

  async getIncomingRelationships(
    entity: RelationshipEntityReference | RelationshipEntityReference[],
    options: RelationshipServiceOptions = {},
  ): Promise<RelationshipEdge[]> {
    const result = await this.repository.findIncoming(entity, normalizeOptions(options));
    return uniqueEdges(result.edges);
  }

  async getRelationshipSummary(
    entity: RelationshipEntityReference,
    options: RelationshipServiceOptions = {},
  ): Promise<RelationshipSummary> {
    const [outgoing, incoming] = await Promise.all([
      this.getOutgoingRelationships(entity, options),
      this.getIncomingRelationships(entity, options),
    ]);
    const edges = uniqueEdges([...outgoing, ...incoming]);
    const typeCounts = new Map<string, number>();

    for (const edge of edges) {
      typeCounts.set(edge.type, (typeCounts.get(edge.type) ?? 0) + 1);
    }

    return {
      entity,
      outgoingCount: outgoing.length,
      incomingCount: incoming.length,
      totalCount: edges.length,
      relationshipTypes: [...typeCounts.entries()].map(([type, count]) => ({ type, count })),
      groups: groupEdges(edges),
    };
  }

  async existsRelationship(
    source: RelationshipEntityReference,
    target: RelationshipEntityReference,
    relationshipType?: string,
  ): Promise<boolean> {
    const result = await this.repository.findBetween(source, target, {
      relationshipTypes: relationshipType ? [relationshipType] : undefined,
      limit: 1,
    });
    return result.edges.length > 0;
  }

  registeredRelationshipTypes(): string[] {
    return relationshipRegistry.map((definition) => definition.key);
  }
}

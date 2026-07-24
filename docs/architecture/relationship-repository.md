# Relationship Repository

`lib/relationships/relationshipRepository.ts` is the canonical read layer for Cinema Atlas knowledge graph relationships.

## Purpose

The repository centralizes graph reads over `knowledge_graph_edges` and returns stable domain models instead of raw SQL rows. Future Explore, Timeline, Continue Journey, and Recommendation work should consume this repository instead of querying the table directly.

## API

- `findOutgoing(entity, options)`
- `findIncoming(entity, options)`
- `findBetween(source, target, options)`
- `findByType(type, options)`
- `findNeighbors(entity, options)`

All methods are entity-agnostic. They operate on `{ type, id }` references and relationship type filters.

## Traversal Preparation

`RelationshipQueryOptions` already accepts `depth`, `direction`, entity filters, relationship filters, and `limit`. This sprint does not implement traversal or ranking; the options exist to keep future API compatibility stable.

## Extension Rules

Adding movies or entity instances requires data only.

Adding a relationship record requires a registered relationship type and valid source/target entity types.

Adding a new relationship type requires updating `relationshipRegistry.ts`; repository code should not change.

Adding a future entity type requires updating the central entity type mapping. Do not add movie-specific branches or hardcoded slug handling to the repository.

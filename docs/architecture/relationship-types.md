# Relationship Types

Cinema Atlas relationships are explicit `knowledge_graph_edges` records governed by one application registry: `lib/relationships/relationshipRegistry.ts`.

## Current Strategy

The existing PostgreSQL schema is sufficient. No migration is required for Relationship Type Foundation v1 because `knowledge_graph_edges` already stores:

- source entity type and id
- relationship type
- target entity type and id
- provenance
- confidence
- curated flag
- creation/update timestamps
- a composite uniqueness constraint for duplicate prevention

## Relationship Classes

- `FACTUAL`: provider-backed catalog facts, such as movie credits or production countries.
- `EDITORIAL`: Cinema Atlas curated knowledge, such as movement membership.
- `DERIVED`: computed relations. These are not materialized in this sprint.

Classification is declared in the registry. It must not be inferred from the relationship type string.

## Extension Rules

Adding a new movie requires data ingestion only. The application architecture must not change.

Adding a new relationship record requires:

- an existing registered relationship type
- valid source and target entity types
- structured provenance
- no duplicate edge unless the type explicitly permits duplicates

Adding a new relationship type requires:

- one new entry in `relationshipRegistry.ts`
- ingestion/query behavior where that type is created or read
- `npm run verify:relationship-types`

Adding a future entity type requires:

- adding it to the central entity type contract
- mapping the persisted database value to the canonical entity type
- registering relationship types that use it

Do not add movie-specific branches, hardcoded slug lists, or inferred editorial edges. Shared semantics belong in the registry; records belong in data.

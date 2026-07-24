# Relationship Service

`lib/relationships/relationshipService.ts` is the canonical application service layer for composing Cinema Atlas knowledge graph relationships.

## Dependency Flow

```text
UI / Query Layer
        ↓
Relationship Service
        ↓
Relationship Repository
        ↓
knowledge_graph_edges
```

## Repository Responsibilities

The Relationship Repository owns storage access. It queries `knowledge_graph_edges`, maps rows into stable relationship domain models, and supports generic filters by entity reference and relationship type.

The repository should not answer product questions. It only returns relationship records.

## Service Responsibilities

The Relationship Service composes repository reads into reusable application operations:

- `getRelatedEntities()`
- `getOutgoingRelationships()`
- `getIncomingRelationships()`
- `getRelationshipSummary()`
- `existsRelationship()`

The service does not perform raw SQL and does not branch on specific entities such as Movie, Person, Country, or Movement. It operates on generic entity references and relationship filters.

## Future Consumers

Future features should build on this service:

- Atlas Explore
- Continue Journey
- Timeline
- Recommendation
- Learning paths
- Search enrichment

Those features may add ranking, traversal, scoring, or recommendation behavior in later layers. This service intentionally does not implement those algorithms.

## Extension Rules

Adding movies or entity instances requires data changes only.

Adding a relationship record requires a registered relationship type and valid source/target entity references.

Adding a relationship type requires updating the central relationship registry and any relevant ingestion/query behavior. The generic service API should not change.

Adding a future entity type should update the central entity type contract. Do not add entity-specific service methods or hardcoded slug branches.

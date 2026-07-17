# Unified Search Foundation v1

## Goal

Unified Search gives Cinema Atlas one entry point across the six canonical entities:

- Movie
- Director
- Actor
- Country
- Movement
- Award

Search does not create a new canonical source. PostgreSQL remains the source of truth, exposed through the existing Catalog Query layer.

## Architecture

```text
Search Input
  -> Search Query Service
  -> Entity-specific adapters
  -> Unified Search Result Projection
  -> /search
  -> Entity Detail Route
```

Pages do not call repositories directly. The `/search` route calls `searchCatalog()`, and the service uses the existing Catalog Query API.

## Result Model

Every result is projected to `UnifiedSearchResult`:

- `entityType`
- `slug`
- `title`
- `subtitle`
- `description`
- `href`
- `matchedField`
- `score`

The UI only reads this unified model.

## Ranking Rules

Search ranking v1 is deliberately simple and explainable:

1. Exact match: 100
2. Prefix match: 80
3. Word-start match: 60
4. Substring match: 40
5. Metadata match: 20

Results are sorted by score, then title.

## Normalization

Search normalizes both query and candidate fields:

- trim
- lowercase
- repeated whitespace collapse
- punctuation-insensitive comparison
- diacritic-insensitive comparison

Country ISO codes such as `KR`, `JP`, and `US` remain searchable.

## Entity Limits

Default result limit is 24.

Initial per-entity diversity limits:

- Movies: 8
- Directors: 4
- Actors: 4
- Countries: 3
- Movements: 3
- Awards: 3

Filtered search returns only the selected entity type.

## Current UI

`/search?q=parasite`

The page includes:

- Search header
- Search input
- Entity filters
- Result count
- Unified result cards
- Empty state

## Future Full Text Search Path

The current implementation is service-level matching over query projections. Future scale can move the matching layer to PostgreSQL with:

- `pg_trgm`
- GIN indexes
- `tsvector`
- accent normalization
- alias tables
- multilingual search fields

The result projection and page contract should remain stable.


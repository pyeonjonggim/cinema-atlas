# Cinema Atlas Canonical Catalog Expansion 100

## Purpose

This expansion turns the catalog from a small pilot set into a 100+ film canonical catalog that can exercise the full Cinema Atlas data path:

TMDB Provider -> Canonical Draft -> Catalog Sync Service -> PostgreSQL -> Knowledge Graph -> Catalog Query -> Search and Encyclopedia UI.

The expansion does not add hand-written movie objects to `data/movies.ts`. Static data remains sample/fallback content only.

## Starting State

Before the expansion:

- Canonical movies: 10
- Canonical persons: 229
- Directors: 10
- Actors: 193
- Countries: 9
- Movements: 3
- Awards: 2
- Knowledge graph edges: 318
- TMDB-backed movies: 10

At least 90 additional canonical movies were required to reach 100.

## Target List

The input list lives at:

- `scripts/fixtures/film-expansion-100.json`

The list contains 116 targets to provide safety margin and broad coverage across periods, countries, genres, and movements. Targets use title/year matching, with room for future `tmdbId` pinning where ambiguity is discovered.

## Editorial Links

Movement and award links are curated separately from provider metadata:

- `scripts/fixtures/film-editorial-links.json`

This keeps the rule clear:

Provider fact is not editorial judgment.

TMDB can provide movie facts, credits, countries, languages, genres, and companies. Cinema Atlas explicitly curates Movement and Award relationships.

## Batch Sync Architecture

Command:

```bash
npm run sync:films:100
```

Flow:

1. Read target list.
2. Resolve TMDB movie by ID or title/year search.
3. Convert external record to canonical draft.
4. Validate canonical draft.
5. Build canonical movie, entity, and edge payloads.
6. Pass the incoming movie and edges through `CatalogSyncService` for sync plan/event reporting.
7. Upsert PostgreSQL records in a transaction.
8. Replace computed movie edges.
9. Preserve and add curated editorial edges separately.
10. Write generated artifacts under `data/imports/catalog-expansion-100/`.

## Idempotency

The sync is safe to rerun.

Identity priority:

1. Existing TMDB external ID
2. IMDb external ID
3. Wikidata external ID
4. Stable canonical hash

The second full run produced:

- Created: 0
- Updated: 115
- Failed: 0

After adding Rashomon to satisfy editorial references, the final run produced:

- Targets: 116
- Created: 1
- Updated: 115
- Failed: 0

## Final Catalog State

After expansion:

- Canonical movies: 116
- Canonical persons: 2,098
- Countries: 38
- Movements: 3
- Awards: 2
- Knowledge graph edges: 3,346
- TMDB-backed movies: 116
- Directors: 99
- Actors: 1,906

## Quality Gates

Verification command:

```bash
npm run verify:catalog:100
```

Final result: PASS

Validated:

- Canonical movie count >= 100
- Duplicate TMDB movie IDs: 0
- Duplicate TMDB person IDs: 0
- Duplicate title/year anomalies: 0
- Movies without director edge: 0
- Movies without country edge: 0
- Raw country display names: 0
- Broken graph edges: 0
- Invalid movie routes: 0
- Unified search sample coverage present

## Country Normalization

TMDB country identifiers are treated as internal IDs. UI-facing display names are normalized through query projections.

Special handling added:

- `xc` -> Czechoslovakia
- Generic country slug fallback now uses display-name slug instead of exposing raw ISO codes when no explicit editorial projection exists.

## Knowledge Graph

Each synced movie creates at least:

- Movie -> Director
- Movie -> Actor
- Movie -> Country

Where available, it also creates:

- Movie -> Genre
- Movie -> Language
- Movie -> Production Company

Curated links are represented separately:

- Movie -> Movement
- Movie -> Award

## Search and Encyclopedia

Unified Search verification passed after expansion:

```bash
npm run verify:unified-search
```

The expanded catalog remains accessible through:

- Movie list/detail
- Director filmography
- Actor filmography
- Country movies
- Movement and Award detail references
- Unified Search results
- Search overlay

## Performance Note

The initial production build exposed an important scaling issue:

`/encyclopedia/countries` was loading all movies and hydrating full movie projections only to calculate country counts.

Fix:

- Added `getCountryMovieCounts()`.
- Country list now counts graph edges without full movie projection hydration.

This resolved the build-time database timeout.

## Known Limitations

- Target matching still uses title/year for many entries. Future expansions should pin more TMDB IDs.
- Movement coverage is intentionally partial and curated.
- Award coverage is intentionally partial and curated.
- This is not a search index build. Search still queries the canonical source through the current search service.
- This is not a 1,000-film import strategy yet.

## Next Expansion Strategy

Recommended sequence:

1. Pin TMDB IDs for all 116 current targets.
2. Expand editorial Movement coverage.
3. Add award/festival curation only where editorially meaningful.
4. Add verification for decade, country, director, and genre distribution thresholds.
5. Move from 100 to 250 with the same idempotent sync path.
6. Before 1,000, add stronger bulk performance checks and query batching.

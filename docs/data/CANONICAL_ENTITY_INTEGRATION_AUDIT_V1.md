# Cinema Atlas Canonical Entity Integration Audit v1

## Scope

Canonical entities:

- Movie
- Director
- Actor
- Country
- Movement
- Award

This sprint audits the data flow from PostgreSQL to UI and adds one minimal live DB
connection for structural verification.

## Data Flow Finding

Current intended flow:

```text
PostgreSQL
-> Repository
-> Query Layer
-> Route
-> Page
-> UI
```

Current actual flow is mixed:

```text
data/*.ts
data/imports/catalog-persistence-pilot/*.json
-> CatalogQueryService / direct imports
-> Route
-> Page
-> UI
```

`CatalogQueryService` currently reads generated JSON artifacts plus static fallback, not live
PostgreSQL. `PostgresCatalogRepository` exists, but most UI routes do not use it.

## Entity Data Source Matrix

| Entity | List Page Source | Detail Page Source | Repository | Query Layer | Static/Mock |
| --- | --- | --- | --- | --- | --- |
| Movie | `MovieListPage` via `CatalogQueryService` | `CatalogQueryService.getMovieById` | Postgres repository exists | Yes | Artifact + static fallback |
| Director | `data/directors.ts` + `data/movies.ts` | `data/directors.ts` + catalog movie list | Person repo partial | Filmography only | Yes |
| Actor | Derived from `data/movies.ts` | `data/actors.ts` + `data/movies.ts` | Person repo partial | Exists but page does not use | Yes |
| Country | `data/countries.ts` + `data/movies.ts` | `canonicalEntityQuery` + catalog movie list | Country repo partial | Minimal live detail lookup | Static fallback |
| Movement | Derived from `data/movies.ts` | `data/movements.ts` + `data/movies.ts` | Missing | Missing | Yes |
| Award | `data/awards.ts` | `data/awards.ts` + `data/movies.ts` | Missing | Missing | Yes |

## Route Matrix

| Route | Entity | Current Source |
| --- | --- | --- |
| `/movies` | Movie | `MovieListPage` / `CatalogQueryService` |
| `/movies/[id]` | Movie | `CatalogQueryService` |
| `/encyclopedia/directors` | Director | `data/directors.ts` + `data/movies.ts` |
| `/encyclopedia/directors/[director]` | Director | static director + catalog movie list |
| `/encyclopedia/actors` | Actor | derived from `data/movies.ts` |
| `/encyclopedia/actors/[actor]` | Actor | static actor/movie data |
| `/encyclopedia/countries` | Country | static country/movie data |
| `/encyclopedia/countries/[country]` | Country | live DB country lookup + catalog movie list |
| `/encyclopedia/movements` | Movement | derived from `data/movies.ts` |
| `/encyclopedia/movements/[movement]` | Movement | static movement/movie data |
| `/encyclopedia/awards` | Award | static award data |
| `/encyclopedia/awards/[award]` | Award | static award/movie data |

## Dynamic Slug Audit

All canonical detail routes read route params and call `notFound()` when the static entity lookup
fails.

Issue:

- Slug lookup is mostly static, so PostgreSQL changes do not affect the selected entity.
- `catalog_people` has no slug projection for Director/Actor pages.
- `catalog_countries` uses canonical IDs such as `jp`, while UI routes use slugs such as
  `japan`.
- Movement and Award have no PostgreSQL table.

No detail route was found that hard-codes the first entity as the route entity. Some page
components use first related items for editorial highlights, which is expected and separate from
route slug resolution.

## Repository Matrix

| Entity | Repository Status |
| --- | --- |
| Movie | Implemented in `PostgresCatalogRepository` |
| Director | Partial as `catalog_people`; no Director projection repository |
| Actor | Partial as `catalog_people`; no Actor projection repository |
| Country | Partial; live detail lookup added through `canonicalEntityQuery` |
| Movement | Missing |
| Award | Missing |

## Query Layer Matrix

| Entity | Query Layer Status |
| --- | --- |
| Movie | `CatalogQueryService`, artifact-backed |
| Director | Filmography helper only |
| Actor | Filmography helper exists, page not migrated |
| Country | Minimal `canonicalEntityQuery` live DB lookup for detail |
| Movement | Missing |
| Award | Missing |

## Database Coverage

PostgreSQL v1 schema contains:

- `catalog_movies`
- `catalog_people`
- `catalog_countries`
- `catalog_genres`
- `catalog_languages`
- `catalog_companies`
- `knowledge_graph_edges`

It does not contain:

- `catalog_movements`
- `catalog_awards`

Relationship coverage:

- Movie -> Director: `MOVIE_DIRECTED_BY_PERSON`
- Movie -> Actor: `MOVIE_ACTED_BY_PERSON`
- Movie -> Country: `MOVIE_PRODUCED_IN_COUNTRY`
- Movie -> Movement: edge type exists, but curated/pilot only
- Movie -> Award: edge type exists, but no persistence table or sync path

## Sync Coverage

| Entity | Coverage |
| --- | --- |
| Movie | Stored |
| Director | Stored as Person + relation |
| Actor | Stored as Person + relation |
| Country | Stored + relation |
| Movement | Curated edge only, no table |
| Award | Not stored |

## Rendering / Cache Audit

No canonical entity detail page currently uses `generateStaticParams`, `revalidate`,
`unstable_cache`, or explicit `cache()` wrappers.

Risk:

- Even without explicit caching, static imports and artifact-backed query results can make UI look
  stale relative to PostgreSQL.

## Canonical Source Matrix

| Entity | Target Canonical Source | Current Source |
| --- | --- | --- |
| Movie | PostgreSQL | Artifact-backed query + static fallback |
| Director | PostgreSQL | Static director + person relations in DB |
| Actor | PostgreSQL | Static actor/movie derived |
| Country | PostgreSQL | Minimal live detail lookup + static fallback |
| Movement | PostgreSQL | Static only; DB table missing |
| Award | PostgreSQL | Static only; DB table missing |

## Minimal Connection Verification

Representative entity: Country.

Change:

```text
/encyclopedia/countries/[country]
-> getCanonicalCountryBySlug()
-> PostgreSQL catalog_countries
-> CountryDetailPage
```

The route still falls back to `data/countries.ts` when no DB is configured or no matching country
record exists. With `DATABASE_URL`, country name and ISO display can reflect `catalog_countries`.

## Next Sprint Recommendation

Build a unified Canonical Entity Query Layer:

```text
CatalogEntityRepository
-> CanonicalEntityQueryService
-> Movie / Director / Actor / Country / Movement / Award pages
```

Required next steps:

1. Add canonical tables/projections for Movement and Award.
2. Add slug mapping/projection for Person as Director/Actor.
3. Move `CatalogQueryService` from generated artifacts to repository-backed reads.
4. Migrate list pages before detail pages for each entity.
5. Keep static data as development fallback only.

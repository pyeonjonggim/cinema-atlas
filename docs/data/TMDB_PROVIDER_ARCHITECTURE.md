# TMDB Provider Architecture

## 1. Purpose

TMDB is the first metadata provider for Cinema Atlas. It is not the catalog model.

The flow is:

TMDB
-> `TmdbCatalogProvider`
-> `ExternalMovieRecord`
-> Normalizer
-> `CanonicalMovieDraft`
-> Validation
-> Cinema Atlas Catalog

No UI, route, Passport, Journal, or user feature should call TMDB directly.

## 2. No Vendor Lock-in

Cinema Atlas must never become TMDB-shaped.

Rules:

- Do not use `tmdbId` as the primary internal relationship key.
- Do not import TMDB response types into UI components.
- Do not store TMDB-specific response objects as Movie data.
- Do not make page routes depend on TMDB IDs.
- Keep TMDB response types inside provider and mapping layers.
- Catalog and UI should depend on provider-neutral records such as `ExternalMovieRecord`, `CanonicalMovieDraft`, and `ExternalIds`.

TMDB is one provider behind the `CatalogProvider` interface.

## 3. Provider Interface

The provider interface supports:

- `searchMovie()`
- `getMovieDetails()`
- `getMovieCredits()`
- `getMovieExternalIds()`
- `getMovieImages()`
- `getImageConfiguration()`

Future providers should implement the same concepts without leaking provider-specific types.

## 4. Environment Variables

TMDB credentials must be server-side only.

Supported variables:

- `TMDB_API_KEY`
- `TMDB_ACCESS_TOKEN`

They belong in `.env.local`. They must never be hardcoded and must never be read by Client Components.

## 5. TMDB Types

TMDB response types are isolated in:

- `types/catalog/tmdb.ts`

These types describe raw provider payloads only. They are not canonical Cinema Atlas data.

## 6. ExternalMovieRecord Mapping

`TmdbCatalogProvider` maps TMDB data into provider-neutral records:

- `ExternalIds`
- `MovieExternalMetadata`
- `CatalogCredit`
- `CatalogImageSet`
- `ExternalMovieRecord`

The mapping keeps TMDB paths and identifiers source-aware, while avoiding direct dependency on TMDB response shapes outside the provider.

## 7. Normalizer

The normalizer converts provider records into:

- `NormalizedMovieRecord`
- `CanonicalMovieDraft`

This keeps provider import separate from the compatibility-heavy current `Movie` type.

`CanonicalMovieDraft` is the future catalog-safe shape. It stores IDs, external metadata, and relation arrays without UI display fallbacks.

## 8. External IDs

TMDB may provide:

- TMDB ID
- IMDb ID
- Wikidata ID when available through external IDs

Cinema Atlas stores these in `ExternalIds`.

Internal Cinema Atlas IDs remain primary. External IDs are for reconciliation, import, and deduplication.

## 9. Credits Mapping

TMDB credits are mapped to provider-neutral credits:

- Director
- Writer
- Producer
- Actor
- Crew

This sprint does not create Director or Actor entities from TMDB. It prepares credit information at `ExternalMovieRecord` level only.

## 10. Image Strategy

TMDB image paths are stored as paths first.

Cinema Atlas should not blindly store large absolute URLs as canonical image data. Image rendering should use:

- provider path
- provider image configuration
- selected size strategy

Poster and backdrop images from TMDB are external metadata. Home, Journey, Country, and other editorial hero images remain Cinema Atlas assets.

## 11. Error Handling

Provider errors are normalized into provider-neutral error codes:

- `not-found`
- `unauthorized`
- `rate-limited`
- `network`
- `malformed-response`
- `provider-down`
- `unknown`

Raw provider errors should not be shown directly in UI.

## 12. Retry

The provider retries network failures once.

It does not retry:

- 401 Unauthorized
- 404 Not Found
- 429 Rate Limited
- malformed response

Rate-limit handling should later move into a queue or sync worker.

## 13. Cache Position

This sprint does not implement a cache.

The cache should sit between:

Catalog Import / Sync
-> CatalogProvider

Possible future cache layers:

- memory cache
- file cache for development
- Redis
- database cache

Provider consumers should not care which cache is used.

## 14. Pilot Test

Pilot script:

`npm run pilot:tmdb`

Pilot movies:

- Parasite
- Seven Samurai
- The Godfather
- Spirited Away
- In the Mood for Love
- Oldboy
- Pulp Fiction
- Roma
- City of God
- The Seventh Seal

If `TMDB_API_KEY` or `TMDB_ACCESS_TOKEN` is missing, the script skips live calls safely.

The pilot validates:

- Search result presence
- year matching for ambiguous titles
- Movie Detail mapping
- Credits mapping
- External IDs mapping
- `ExternalMovieRecord` to `NormalizedMovieRecord`
- `ExternalMovieRecord` to `CanonicalMovieDraft`
- Canonical draft validation
- Mismatch reporting

Current environment note:

- `.env.local` is present in the current local workspace.
- `TMDB_ACCESS_TOKEN` is configured.
- `npm run pilot:tmdb` executed successfully against the live TMDB API.

Live pilot result:

| Movie | TMDB ID | Search | Detail | Credits | External IDs | Normalization | Validation |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| Parasite (2019) | 496243 | ok | ok | ok | ok | ok | ok |
| Seven Samurai (1954) | 346 | ok | ok | ok | ok | ok | ok |
| Spirited Away (2001) | 129 | ok | ok | ok | ok | ok | ok |
| Oldboy (2003) | 670 | ok | ok | ok | ok | ok | ok |
| The Godfather (1972) | 238 | ok | ok | ok | ok | ok | ok |
| Pulp Fiction (1994) | 680 | ok | ok | ok | ok | ok | ok |
| In the Mood for Love (2000) | 843 | ok | ok | ok | ok | ok | ok |
| Roma (2018) | 426426 | ok | ok | ok | ok | ok | ok |
| City of God (2002) | 598 | ok | ok | ok | ok | ok | ok |
| The Seventh Seal (1957) | 490 | ok | ok | ok | ok | ok | ok |

Pilot summary:

- External records: 10
- Normalized records: 10
- Normalizer issues: 0
- Mismatch report: no mismatches detected

Known pilot matching notes to review when credentials are available:

- `Roma (2018)` matched TMDB ID `426426`.
- `Oldboy (2003)` matched TMDB ID `670`.
- `City of God (2002)` matched TMDB ID `598`.
- `The Seventh Seal (1957)` matched TMDB ID `490`.

## 15. Attribution

TMDB metadata requires attribution when used publicly. This sprint documents the requirement but does not add UI attribution.

Before production launch, an About/Credits area should include the required TMDB attribution and follow TMDB brand guidelines.

## 16. 100 Movie Ingestion QA

Batch script:

`npm run ingest:pilot100`

Output folder:

`data/imports/tmdb-pilot-100/`

Generated outputs:

- `raw/external-movie-records.json`
- `normalized/normalized-movie-records.json`
- `canonical/canonical-movie-drafts.json`
- `reports/summary.json`
- `reports/quality-report.json`
- `reports/duplicates.json`
- `reports/unresolved.json`
- `reports/statistics.json`

Latest pilot result:

- Movies tested: 100
- External records: 100
- Normalized records: 100
- Canonical drafts: 100
- Average pipeline success: 100%
- Average content quality: 99.55
- Missing posters: 1
- Missing backdrops: 1
- Missing credits: 0
- Missing IMDb IDs: 0
- Duplicate candidates: 3
- Manual review queue: 3
- Pipeline status distribution: 97 PASS / 3 WARNING
- Quality distribution: 97 at 100, 2 at 90+, 1 at 60-

Performance:

- Total processing time: 11,572 ms
- Average movie processing time: 341 ms
- Average TMDB search time: 161 ms
- Average TMDB detail time: 180 ms
- Average normalization time: 0 ms
- Average validation time: 0 ms
- Concurrency: 3

Quality scoring:

- Pipeline status answers whether the provider flow completed: PASS, WARNING, or FAILED.
- Content quality score answers whether the record is catalog-ready.
- Pipeline PASS alone is not enough for catalog insertion.
- Review reasons apply score penalties after weighted checks, so a technically successful pipeline can still produce a lower content quality score.
- Current catalog-ready threshold: pipeline status is not FAILED and content quality is at least 90, with manual review resolved.

Content quality weights:

| Check | Weight |
| --- | ---: |
| Search match | 20 |
| Year match | 15 |
| Movie detail | 15 |
| Credits | 15 |
| Poster | 5 |
| Backdrop | 5 |
| External IDs | 10 |
| Normalization | 5 |
| Validation | 10 |
| Metadata completeness | 10 |

Review reason penalties:

| Reason | Penalty |
| --- | ---: |
| YEAR_VARIANT | 5 |
| MULTIPLE_MATCH | 10 |
| POSTER_MISSING | 5 |
| BACKDROP_MISSING | 5 |
| UNKNOWN_COUNTRY | 5 |
| UNKNOWN_LANGUAGE | 5 |
| MISSING_RUNTIME | 10 |
| MISSING_CREDITS | 15 |
| MISSING_IMDB | 10 |
| LOW_CONFIDENCE_MATCH | 25 |
| VALIDATION_ERROR | 25 |
| PROVIDER_ERROR | 25 |

Year matching rules:

| Classification | Rule | Review |
| --- | --- | --- |
| EXACT_MATCH | Expected year equals provider release year | no review by itself |
| WITHIN_ONE_YEAR | Difference is one year | YEAR_VARIANT review |
| HARD_MISMATCH | Difference is more than one year | LOW_CONFIDENCE_MATCH review |
| UNKNOWN_YEAR | Provider year is missing | manual review |

Manual review reason codes:

- YEAR_VARIANT
- MULTIPLE_MATCH
- POSTER_MISSING
- BACKDROP_MISSING
- UNKNOWN_COUNTRY
- UNKNOWN_LANGUAGE
- MISSING_RUNTIME
- MISSING_CREDITS
- MISSING_IMDB
- LOW_CONFIDENCE_MATCH
- VALIDATION_ERROR
- PROVIDER_ERROR

Manual review queue:

| Movie | Reason | Pipeline | Content Quality |
| --- | --- | --- | ---: |
| Casablanca (1942) | YEAR_VARIANT: expected 1942, matched 1943 | WARNING | 95 |
| Jeanne Dielman, 23 quai du Commerce, 1080 Bruxelles (1975) | YEAR_VARIANT: expected 1975, matched 1976 | WARNING | 95 |
| Crash (2004) | LOW_CONFIDENCE_MATCH plus missing poster and backdrop | WARNING | 65 |

Crash investigation:

- The pilot expected the 2004 feature film.
- TMDB search selected provider movie `1353802`, also titled `Crash` with release date `2004-10-16`.
- The selected record is a 5-minute Australian short and has missing poster/backdrop paths.
- This is a wrong search match caused by exact title/year matching being too weak for ambiguous titles.
- Non-short pilot movies matched to runtimes under 40 minutes now receive `LOW_CONFIDENCE_MATCH`.

Duplicate candidates:

| Title | Classification | Candidates |
| --- | --- | --- |
| Oldboy | REMAKE | 2003 / 2013 |
| Suspiria | REMAKE | 1977 / 2018 |
| A Star Is Born | REMAKE | 1937 / 2018 |

Duplicate classification:

- REMAKE: same normalized title across known remake years.
- SAME_TITLE_DIFFERENT_MOVIE: same normalized title but different movie identity is likely.
- DIRECTORS_CUT: future classification for alternate cuts of the same work.
- EXTENDED_CUT: future classification for runtime/version variants.
- ALTERNATE_RELEASE: future classification for release-region or restored-release variants.
- POSSIBLE_DUPLICATE: fallback requiring manual review.
- Automatic merge remains forbidden.

Known edge cases:

- Release year can differ between canonical film history usage and TMDB release date data.
- Some records may have valid detail/credits/external IDs while still missing poster or backdrop assets.
- Same-title remakes should be reported, not merged.
- Exact title/year match is insufficient for ambiguous titles such as `Crash`.
- Runtime and format tags are useful signals for detecting false positives.
- Manual review is not failure. It is the safety layer before catalog creation.

Future batch strategy:

1. Keep `pilot100` as a repeatable provider regression suite.
2. Add a 100-movie review checklist before any catalog write.
3. Expand to a 500-movie QA set only after duplicate and country/language normalization rules are stricter.
4. Add provider cache before larger runs.
5. Add stronger disambiguation inputs such as expected director, runtime band, country, or external ID when available.

## 17. Future Providers

Future providers can include:

- Wikidata
- OMDb
- MUBI
- custom datasets
- festival datasets
- national film archive datasets

Adding providers should not require Cinema Atlas UI or Catalog model rewrites.

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

## 15. Attribution

TMDB metadata requires attribution when used publicly. This sprint documents the requirement but does not add UI attribution.

Before production launch, an About/Credits area should include the required TMDB attribution and follow TMDB brand guidelines.

## 16. Future Providers

Future providers can include:

- Wikidata
- OMDb
- MUBI
- custom datasets
- festival datasets
- national film archive datasets

Adding providers should not require Cinema Atlas UI or Catalog model rewrites.


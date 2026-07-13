# Global Catalog Architecture v1

## 1. Purpose

Cinema Atlas is no longer a personal movie archive. It is becoming a global cinema exploration platform.

The platform must support:

- 100,000 to 300,000+ movies
- hundreds of thousands of directors and actors
- hundreds of countries and movements
- thousands of awards
- user records that remain separate from the global catalog

This sprint does not import global data. It defines the architecture that allows global data to arrive without breaking the current product.

## 2. Three-Layer Model

Cinema Atlas must keep three layers separate:

1. External Metadata
2. Cinema Atlas Editorial Knowledge
3. User Exploration Data

These layers may reference each other through stable IDs, but they should not own each other's responsibilities.

## 3. Global Catalog

The Global Catalog stores shared cinema facts.

Catalog entities:

- Movie
- Director
- Actor
- Country
- Movement
- Award
- Production Company
- Genre
- Language
- External IDs

The catalog answers:

- What is this work?
- Who made it?
- Where is it from?
- What external identifiers describe it?
- Which entities is it connected to?

It does not answer:

- Did this user watch it?
- What did this user rate it?
- Did this user write a journal about it?
- Is this user's favorite?

## 4. External Metadata Layer

External metadata is imported or synchronized from sources such as TMDB, IMDb, Wikidata, CSV, Excel, or manual import.

Examples:

- title
- original title
- release date
- runtime
- poster
- backdrop
- credits
- genres
- production countries
- production companies
- spoken languages
- external rating or popularity

External metadata must remain source-aware. It should be represented through types like `ExternalIds` and `MovieExternalMetadata`.

External metadata is useful, but it is not Cinema Atlas's voice.

## 5. Cinema Atlas Editorial Layer

Editorial knowledge is Cinema Atlas's competitive layer.

Examples:

- Why This Movie Matters
- Why This Director Matters
- Essential Films
- Recommended Starting Point
- Atlas Note
- Related Journey
- Study Topics
- Difficulty
- Explorer Tags
- Journey Stops
- Atlas Essays
- Study Guides
- Explorer Recommendations

Editorial data is not generated directly by external APIs. It is curated, written, reviewed, or intentionally designed by Cinema Atlas.

## 6. Entity Layer

Movies should not store director names, actor names, country names, awards, companies, genres, or languages as canonical relationships.

Movies should store relation IDs:

- `directorIds`
- `actorIds`
- `countryIds`
- `movementIds`
- `awardIds`
- `productionCompanyIds`
- `genreIds`
- `languageIds`

Display names resolve from entity data.

Current compatibility fields remain temporarily for existing UI. They are not canonical catalog fields.

## 7. User Layer

User data is outside the Global Catalog.

User-layer entities:

- UserMovie
- JournalEntry
- Collection
- Passport
- Challenge
- Achievement
- Milestone
- Rating
- Watch History
- Favorite

The same Movie can be watched, rated, journaled, collected, or ignored by many users. Therefore user state must never be embedded in Movie.

## 8. External ID Strategy

Cinema Atlas internal IDs remain the primary application keys.

External IDs attach to internal entities:

- `tmdbId`
- `imdbId`
- `wikidataId`
- `letterboxdSlug`
- `sourceIds`

Principle:

Internal ID -> External IDs

External IDs help import, deduplicate, enrich, and reconcile data. They should not replace Cinema Atlas internal IDs or routes.

## 9. Import Pipeline Interface

Future import should follow this path:

External Movie
-> Normalizer
-> Canonical Movie
-> Validation
-> Relation Resolver
-> Catalog

Current foundation:

- `RawMovieRecord`
- `NormalizedMovieRecord`
- `ExternalMovieRecord`
- `CatalogImportPipeline`
- `catalogImportPipeline`

This interface is intentionally small. It prepares the shape without downloading or importing a large dataset.

## 10. Duplicate Strategy

Movie duplication is difficult at global scale.

Duplicate candidates should be detected through:

- internal ID
- TMDB ID
- IMDb ID
- Wikidata ID
- source ID
- normalized title + year
- normalized original title + year
- release date
- runtime
- primary director IDs

Do not auto-merge ambiguous records.

Special cases:

- same-title movies
- remakes
- director's cuts
- extended cuts
- TV cuts
- restoration versions
- festival versions
- regional release title differences

Recommended approach:

- Treat alternate versions as separate records only when they have meaningful external IDs, runtime differences, release differences, or editorial need.
- Store variant relationships explicitly later, not by collapsing them into one row.

## 11. Image Strategy

Images have different responsibilities.

Movie:

- Poster: external metadata identity image.
- Backdrop: external metadata atmosphere image.
- Cinema Atlas hero image: editorial asset when needed.

Director / Actor:

- Portrait can come from external metadata or a Cinema Atlas asset.

Country:

- Hero image should be Cinema Atlas editorial or licensed asset, not generic tourism imagery.

Movement:

- Hero image should represent a film still, period, or visual idea.

Journey:

- Hero image is a Cinema Atlas editorial asset.

Principle:

- Poster belongs mostly to external metadata.
- Hero belongs mostly to Cinema Atlas editorial.
- Source and ownership should be tracked.

## 12. Search Layer Foundation

Global Search should not search UI components directly.

Every searchable item can become a `SearchDocument`:

- Movie
- Director
- Actor
- Country
- Movement
- Award
- Journey
- Collection
- Journal

Search document fields:

- id
- type
- title
- subtitle
- description
- route
- keywords
- facets
- popularity
- updatedAt

This layer lets search evolve from client-side sample search to backend indexing without changing the product IA.

## 13. Scalability Review

### 100 Movies

Static arrays and simple filters are acceptable.

### 1,000 Movies

Resolvers should be used instead of repeated component-level `find`.

### 10,000 Movies

Build-time indexes become important:

- `movieById`
- `moviesByDirectorId`
- `moviesByCountryId`
- `moviesByActorId`
- `moviesByAwardId`

### 100,000 Movies

Catalog queries should move behind server/database adapters. UI should request filtered slices, not full arrays.

### 300,000+ Movies

Search, relation traversal, and import validation must be index-first and backend-backed. The frontend model should still use the same concepts:

- internal ID
- external IDs
- entity relations
- editorial layer
- user layer

## 14. Current Compatibility Strategy

The current sample data may keep fields such as:

- `director`
- `directorSlug`
- `country`
- `countrySlug`
- `actors`
- `actorSlugs`
- `awards`
- `awardSlugs`

These are compatibility fields.

Migration should happen in stages:

1. Keep compatibility fields.
2. Add canonical ID arrays.
3. Add resolvers and validators.
4. Move page logic to resolvers.
5. Remove compatibility fields only after usage reaches zero.

## 15. Future Database Mapping

Possible future tables or collections:

- movies
- people
- directors
- actors
- countries
- movements
- awards
- production_companies
- genres
- languages
- movie_external_ids
- movie_credits
- movie_editorial
- journey_steps
- user_movies
- journal_entries
- collections
- passport_events

The frontend should not depend on the storage engine. Routes and page components should keep using domain concepts and resolver/query adapters.

## 16. Non-Goals

This architecture does not:

- introduce a database
- import thousands of movies
- download TMDB
- replace current UI
- change routes
- merge user data into catalog data
- treat external metadata as editorial knowledge


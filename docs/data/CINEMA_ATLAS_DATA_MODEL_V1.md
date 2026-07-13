# Cinema Atlas Data Model v1

## 1. Brand-Level Data Principle

Cinema Atlas is moving from sample data toward a large cinema knowledge graph. The data model must support a personal 800-film archive now and remain structurally safe for a catalog that can grow toward hundreds of thousands of films.

The rule is:

- Movie knows the work.
- Entity data knows cinema knowledge.
- UserMovie knows the user's experience.
- JournalEntry knows the user's memory.
- Computed relations are derived.
- Curated knowledge is stored explicitly.

## 2. Canonical Entities

### Movie

Canonical movie relationships should be id-based arrays:

- `countryIds`
- `directorIds`
- `actorIds`
- `movementIds`
- `awardIds`
- `genreIds`

Compatibility fields such as `country`, `countrySlug`, `director`, `directorSlug`, `actors`, `actorSlugs`, `movement`, `movementSlug`, `awards`, and `awardSlugs` remain for the current UI. They are deprecated display or fallback fields, not canonical relationship storage.

### Encyclopedia Entities

Current encyclopedia entities use stable slugs:

- Director: `slug`
- Actor: `slug`
- Country: `slug`
- Movement: `slug`
- Award: `slug`

The slug is currently the stable entity key. Future backend mapping may add separate immutable IDs, but routes and current data should continue to resolve by slug.

## 3. ID Strategy

Movie IDs should be stable strings and should not depend on mutable display names alone. Existing slug-like movie IDs remain supported.

Entity IDs/slugs must be:

- unique
- lowercase
- trimmed
- space-free
- stable across display-name changes

Display names are only for presentation. Relationships should use IDs/slugs.

## 4. Computed vs Curated Relations

### Computed from Movie Data

These should usually be derived from canonical movie relations:

- director filmography
- actor appearances
- country films
- movement films
- award-linked films
- movie counts
- representative decades
- frequent collaborators
- exploration counts

### Curated and Stored Explicitly

These are editorial choices and should remain explicit:

- `essentialMovieIds`
- `starterMovieId`
- `recommendedOrder`
- `related entities`
- `influencedBy`
- `whyMatters`
- descriptions and contextual copy

## 5. Movie vs UserMovie

Movie represents the film itself. It can hold catalog or external-average data such as `averageRating`, but it must not own personal history.

User-specific data belongs to `UserMovie`:

- `watchStatus`
- `myRating`
- `watchedDate`
- `rewatchCount`
- `favorite`
- `journalIds`
- `personalTags`
- `isOwned`

Legacy movie fields such as `myRating`, `watchedDate`, and `memo` are migration candidates only.

## 6. JournalEntry

Journal entries are independent records keyed by `movieId`. A movie can have many journal entries from the same user over time.

`memo` should not live on Movie. Journal body, mood, spoiler state, visibility, and kind belong to `JournalEntry`.

## 7. Import Pipeline

Future CSV, Excel, Watcha, or manual imports should follow this pipeline:

1. Preserve the original file.
2. Convert rows to `RawMovieRecord`.
3. Normalize whitespace, Unicode, year, rating, date, and name lists.
4. Produce duplicate candidates using normalized title + year, original title + year, and source ID.
5. Match existing entities by aliases and stable slugs.
6. Report unresolved entities.
7. Create or update Movie records.
8. Create UserMovie records.
9. Run `npm run validate:data`.
10. QA representative UI pages.

Automatic merge is intentionally avoided. Conflicts should be reported for review.

## 8. Validation Rules

The data validation layer checks:

- duplicate IDs/slugs
- missing required fields
- invalid year/runtime/rating values
- duplicate relation IDs
- unknown movie/entity references
- orphan UserMovie and JournalEntry references
- collection movie references
- journey step references
- passport challenge and achievement references

Validation output is meant for development and build-time checks. Production UI should not expose raw validation messages.

## 9. Image Field Strategy

Movie image fields:

- `posterPath`
- `posterUrl`
- `backdropPath`
- `backdropUrl`
- compatibility `poster`
- compatibility `backdrop`

Entity image fields can later use:

- `heroImage`
- `portrait`
- `thumbnail`

No-image states should render semantic gradient or texture placeholders. Large "No Poster" or "No Image" text should not be used as a primary visual.

## 10. Compatibility Layer

The current UI still uses compatibility fields in several places. Do not delete those fields in a single migration.

Recommended sequence:

1. Add canonical arrays and resolver support.
2. Run validation.
3. Migrate page-level logic to resolver functions.
4. Remove direct dependency on display relation fields.
5. Delete deprecated fields only after UI usage reaches zero.

## 11. Performance Direction

For a few dozen films, array search is fine. For 800 films, repeated `find` and `filter` become noisy. For 200,000-film scale, lookup and relationship access must be index-first.

Current foundation:

- `movieById`
- `directorById`
- `actorById`
- `countryById`
- `movementById`
- `awardById`
- inverse relationship helpers

Future backend mapping should move these indexes to build-time or server-side query layers without changing page-level intent.

## 12. 800-Movie Migration Plan

Recommended migration batches:

1. 20-film pilot
2. 100-film QA batch
3. remaining batch

Each batch should include:

1. Raw file snapshot.
2. RawMovieRecord conversion.
3. Duplicate candidate report.
4. Existing entity match report.
5. Unresolved entity report.
6. Movie creation.
7. UserMovie creation.
8. Validation.
9. UI QA for Movie Detail, Encyclopedia, Explore/Journey, Passport, My Atlas, Journal, Collection.
10. Batch commit.

## 13. Future Backend Mapping

When a database is introduced later:

- Movie becomes shared catalog data.
- UserMovie becomes user-scoped record data.
- JournalEntry becomes user-scoped written memory.
- Entity tables use stable slugs or immutable IDs.
- Resolver APIs become query adapters.
- Validation becomes import/CI integrity checks.

No frontend route needs to change for that migration.


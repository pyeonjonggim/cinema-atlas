# Entity Resolution Engine v1

## 1. Purpose

Entity Resolution decides whether an external entity candidate is the same real-world subject as an existing Cinema Atlas entity.

The flow is:

External Entity Candidate
-> Normalize
-> Exact Identifier Match
-> Alias Match
-> Candidate Scoring
-> Resolved / Review Required / New Entity
-> Approved Entity Reference

This sprint does not change UI, routes, or production data.

## 2. Current Entity Audit

Current entity storage:

| Entity | Current source | Current identity style | Notes |
| --- | --- | --- | --- |
| Director | `data/directors.ts`, `types/director.ts` | slug | UI/editorial projection. No external IDs yet. |
| Actor | `data/actors.ts` | slug | UI/editorial projection. Can become Person projection later. |
| Country | `data/countries.ts` | slug | Curated encyclopedia entity. ISO-like catalog IDs exist in imports. |
| Movement | `data/movements.ts` | slug | Curated only. Must not be generated from TMDB metadata. |
| Award | `data/awards.ts` | slug | Curated only. Must not be generated from TMDB metadata. |
| Genre | TMDB/import artifact | provider IDs | Needs canonical genre mapping before production persistence. |
| Language | TMDB/import artifact | ISO code | Good candidate for ISO-first resolution. |
| Production Company | TMDB/import artifact | provider ID | Name-only merge is unsafe. |
| CatalogPersonRecord | `types/catalogPersistence.ts` | internal ID + external IDs | Long-term unified person entity. |

Findings:

- Director and Actor can be represented as a unified Person catalog entity in the long term.
- Existing Director/Actor pages should remain editorial projections, not be deleted.
- Current curated slugs remain useful for URLs and editorial content.
- External IDs are sparse in curated data, so low-confidence display-name merges must go to review.
- Movement and Award are editorial/curated concepts and are excluded from automatic TMDB entity creation.

## 3. Unified Person Strategy

Long-term model:

`CatalogPersonRecord`

- id
- displayName / name
- originalName
- aliases
- externalIds
- birthDate
- deathDate
- knownForDepartment
- profilePath
- provenance
- approvalState

Roles belong on edges, not on the person record:

- `MOVIE_DIRECTED_BY_PERSON`
- `MOVIE_ACTED_BY_PERSON`
- `MOVIE_WRITTEN_BY_PERSON`
- `MOVIE_PRODUCED_BY_PERSON`

Director and Actor Encyclopedia types remain UI/editorial projections.

## 4. Candidate Types

Provider-neutral candidate types:

- `ExternalPersonCandidate`
- `ExternalCountryCandidate`
- `ExternalGenreCandidate`
- `ExternalLanguageCandidate`
- `ExternalCompanyCandidate`

Shared fields:

- provider
- providerEntityId
- displayName
- originalName
- aliases
- externalIds
- metadata
- sourceMovieId
- sourceRole

TMDB raw types do not leave the provider layer.

## 5. Normalization Rules

Person:

- Unicode NFKC normalization
- whitespace normalization
- punctuation normalization
- diacritic-preserving canonical name
- diacritic-insensitive comparison name
- original script preserved
- reordered-name auto conversion is not applied in v1

Country:

- ISO code first
- approved aliases for `USA`, `United States`, `Republic of Korea`, `Czech Republic`
- historic or political entities are not collapsed automatically

Language:

- ISO 639 code first
- approved aliases such as `Farsi` -> `Persian`

Genre:

- provider genre IDs map to canonical internal genre IDs
- provider display name is not the primary key

Company:

- provider ID first
- exact name alone is review-only when multiple companies share a name
- origin country can support but not override conflicts

## 6. Matching Priority

Person:

1. Same provider external ID
2. Same IMDb / Wikidata ID
3. Existing approved cross-provider mapping
4. Exact normalized name + supporting metadata
5. Alias match + supporting metadata
6. Review

Country:

1. ISO code
2. approved alias
3. normalized English name
4. manual review

Language:

1. ISO code
2. approved alias
3. normalized name

Genre:

1. internal provider mapping
2. approved alias
3. manual review

Company:

1. provider ID
2. external cross-reference
3. exact name + origin country
4. review

## 7. Scoring and Thresholds

Score range: 0 to 100.

Signals:

- Same provider external ID: 100
- IMDb / Wikidata exact ID: 95
- Exact normalized name: 55
- Alias exact match: 45
- Supporting metadata can raise confidence in future versions

Thresholds:

| Score | Result |
| ---: | --- |
| 95-100 | AUTO_RESOLVED |
| 80-94 | HIGH_CONFIDENCE_REVIEW |
| 60-79 | REVIEW_REQUIRED |
| 0-59 | NEW_ENTITY_CANDIDATE or UNRESOLVED |

Hard conflicts override score.

## 8. Alias Model

Alias type:

`EntityAlias`

Fields:

- value
- normalizedValue
- language
- script
- aliasType
- provenance
- isPreferred
- createdAt

Alias types:

- alternate-name
- localized-name
- former-name
- stage-name
- transliteration
- abbreviation
- provider-label

UI remains English-only, but original names and aliases are preserved for future search.

## 9. Review Queue

Review queue fields:

- candidate type
- incoming value
- source provider
- source record
- best candidates
- scores
- matched fields
- conflicts
- suggested action
- review reasons

Actions:

- link-existing
- create-new
- add-alias
- reject
- defer

There is no admin UI in v1. Review queue is emitted as JSON artifact.

## 10. Conflict Rules

Automatic merge is forbidden for:

- same name but conflicting external IDs
- same name but incompatible birth dates
- company same name but different origin
- person alias with no supporting identifier
- country ambiguous historic/political entity
- provider mapping collision
- two approved entities sharing one exclusive external ID

Conflict reason codes:

- EXTERNAL_ID_CONFLICT
- BIRTH_DATE_CONFLICT
- AMBIGUOUS_NAME
- PROVIDER_MAPPING_CONFLICT
- COUNTRY_ALIAS_AMBIGUOUS
- COMPANY_ORIGIN_CONFLICT

## 11. Resolution Service

Implemented:

- `EntityResolutionService`
- `resolvePerson`
- `resolveCountry`
- `resolveLanguage`
- `resolveGenre`
- `resolveCompany`
- `resolveBatch`
- `findCandidates`
- `createReviewItem`

Repository contract:

- `getEntityById`
- `getEntityByExternalId`
- `findEntitiesByNormalizedName`
- `findEntitiesByAlias`
- `listEntityCandidates`
- `saveEntityAlias`
- `reserveExternalId`

## 12. Idempotency

Repeated entity candidates should not create duplicates:

- entity duplicate: prevented by external ID and normalized indexes
- alias duplicate: prevented by normalized alias key
- review duplicate: review ID uses entity type + normalized incoming value
- relation duplicate: graph edge creation must wait for resolved internal entity ID

Pilot duplicate-prevention count: 3.

## 13. Graph Integration

Edges are created only after resolution:

External Entity Candidate
-> Resolution
-> Approved Internal Entity ID
-> KnowledgeGraphEdge target

Unresolved candidates do not become graph targets.

Pending relation can be stored as an artifact until manual review resolves it.

## 14. Pilot Result

Command:

`npm run resolve:entities-pilot`

Artifacts:

- `data/imports/entity-resolution-pilot/incoming-candidates.json`
- `data/imports/entity-resolution-pilot/resolved.json`
- `data/imports/entity-resolution-pilot/review-queue.json`
- `data/imports/entity-resolution-pilot/conflicts.json`
- `data/imports/entity-resolution-pilot/aliases.json`
- `data/imports/entity-resolution-pilot/summary.json`

Latest result:

- Total candidates: 22
- Auto resolved: 16
- Review required: 1
- New entity candidates: 1
- Conflicts: 4
- Duplicate prevented: 3
- Aliases added: 17
- Average confidence: 85.23
- Resolved targets available for graph edges: 16
- Pending relations required: 6
- Unresolved candidates create edges: false

Pilot difficult cases:

- `Bong Joon-ho` / `Bong Joon Ho`: provider ID and alias resolution
- `Akira Kurosawa` / original script alias
- `Wong Kar-wai` / punctuation variant
- `Alfonso Cuarón` / diacritic-insensitive review path
- `John Smith`: ambiguous person name conflict
- `United States` / `USA`: approved country alias
- `South Korea` / `Republic of Korea`: approved country alias
- `Czechia` / `Czech Republic`: approved country alias
- `Soviet Union` / `Russia`: conflict, no automatic merge
- `Hong Kong` / `China`: conflict, no automatic alias
- `Persian` / `Farsi`: language alias
- `Orion Pictures`: provider ID resolution vs name-only company conflict

## 15. Future Admin Workflow

Future workflow:

1. Import candidates.
2. Auto-resolve exact external ID matches.
3. Queue ambiguous names and low-confidence aliases.
4. Human reviewer chooses link-existing, create-new, add-alias, reject, or defer.
5. Approved entity reference becomes graph edge target.
6. Review decisions become durable cross-provider mappings.

No low-confidence automatic merge should be introduced without review history.


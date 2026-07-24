# Cinema Atlas Current State and Next Priorities

Last updated: 2026-07-24

This document is the working control map for Cinema Atlas. It summarizes what is already built, what is only partially connected, and what should happen next. Detailed sprint documents remain the source for implementation specifics; this file is the product and architecture status board.

## Executive Summary

Cinema Atlas has moved beyond a static movie archive. The core backend platform now exists:

- PostgreSQL-backed canonical catalog
- Canonical query layer for primary entities
- TMDB ingestion and sync foundation
- Entity resolution and editorial override systems
- Unified search
- Media projection and entity imagery
- Relationship registry, repository, service, policy, and Continue Journey engine
- Verification scripts for catalog, media, people, movies, search, and relationship layers

The next phase should not add more infrastructure by default. The highest-value work is now product integration, performance stabilization, and selective use of the relationship platform in visible user flows.

## Current Product Layers

| Layer | Status | Notes |
| --- | --- | --- |
| Movie catalog | Complete / active | PostgreSQL catalog contains 116 canonical movies. Movie integrity verification passes. |
| Director encyclopedia | Active, quality guarded | Person credit and route integrity systems exist. Director profile images are available for verified people. |
| Actor encyclopedia | Active, quality guarded | Actor eligibility rules are in place, but actor volume is high and needs ongoing performance attention. |
| Country encyclopedia | Active | Country normalization and editorial display names are handled through query projection. |
| Movement encyclopedia | Active / editorial | Movements are editorial entities, not TMDB entities. Coverage is intentionally limited. |
| Award encyclopedia | Active / editorial | Awards are editorial entities, not TMDB entities. Coverage is intentionally limited. |
| Unified search | Active | Search route and global overlay exist. Results use one unified projection. |
| Continue Journey | Engine complete, product integration partial | Domain engine, structured explanations, and policy support exist. Full UI adoption should be next. |
| Explore / Journey pages | Legacy / partial | Existing pages predate the relationship platform and should be audited before expansion. |
| Passport / My Atlas / user-owned data | Mostly outside current canonical system | Should remain separate from catalog data until a user-data migration sprint. |

## Data Status

Latest known verified catalog snapshot:

| Metric | Count / Status |
| --- | --- |
| Canonical movies | 116 |
| Canonical persons | 2,098 after catalog expansion |
| Countries | 38 |
| Movements | 3 |
| Awards | 2 |
| Knowledge graph edges | 3,346 |
| TMDB-linked movies | 116 |
| Movie duplicate TMDB IDs | 0 |
| Movie duplicate slugs | 0 |
| Broken movie edges | 0 |
| Missing movie poster paths | 0 |
| Missing movie backdrop paths | 0 |
| Movie needs review | 1 |

Person quality snapshot:

| Metric | Count |
| --- | --- |
| Raw persons analyzed | 1,722 |
| Published actors | 1,212 |
| Published directors | 86 |
| Needs review | 261 |
| Mixed credits | 26 |
| Hidden still published | 0 |

Media snapshot:

| Area | Status |
| --- | --- |
| Movie posters | Covered for the current canonical movie set |
| Movie backdrops | Covered for the current canonical movie set |
| Person profiles | Broad coverage, with fallback support |
| Country heroes | Editorial image foundation exists; not every country requires curated media yet |
| Movement / Award heroes | Foundation exists; full curation can be deferred |

## Architecture Status

### Source of Truth

Canonical catalog source of truth:

```text
PostgreSQL
  -> Repository
  -> Catalog Query Service
  -> Projection
  -> Route
  -> UI
```

Static data still exists for sample compatibility, seed inputs, development fallback, or editorial seeds. It should not be treated as the production canonical source for Movie, Director, Actor, Country, Movement, or Award UI.

### Relationship Platform

The relationship platform is now layered:

```text
Relationship Registry
  -> Relationship Validation
  -> Relationship Repository
  -> Relationship Service
  -> Relationship Policy Engine
  -> Continue Journey Engine
```

Relationship policy verification reports 100% policy coverage across the 10 registered relationship types.

The current registered relationship surface includes factual and editorial links such as movie-to-person credits, movie-to-country, movie-to-movement, and movie-to-award relationships.

### Continue Journey

Continue Journey is ready as a domain engine:

- Supports Movie, Person, Country, and Movement
- Uses structured explanations instead of plain reason strings
- Uses the relationship service and policy engine
- Avoids repository and SQL access
- Produces deterministic, explainable output

Main remaining gap: visible product integration across detail pages.

## Verification Surface

The project currently has a strong verification suite:

- `npm run verify:relationship-policy`
- `npm run verify:continue-journey`
- `npm run verify:relationship-service`
- `npm run verify:relationship-repository`
- `npm run verify:relationship-types`
- `npm run verify:movies`
- `npm run verify:person-credits`
- `npm run verify:editorial`
- `npm run verify:country-review`
- `npm run verify:persons`
- `npm run verify:data-quality`
- `npm run verify:catalog:100`
- `npm run verify:media`
- `npm run verify:unified-search`
- `npm run validate:data`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Known operational note: Git may be unavailable in the local shell PATH. Treat this as an environment limitation, not an implementation failure.

## Current Risks

### 1. Product Integration Lag

Several engines are complete but not fully visible to users. Continue Journey and Relationship Policy are especially important: they are platform-ready, but their product value depends on page integration.

### 2. Performance Pressure

The catalog now has enough movies and people for inefficient page hydration to be noticeable. Detail pages, category pages, director pages, actor pages, and country pages should avoid repeated per-card entity queries.

### 3. Static / Canonical Boundary Confusion

Static files are still present by design, but they can confuse future development. New UI work should read through query services, not directly from `data/*.ts`, unless the file is explicitly an editorial seed or development fallback.

### 4. Review Workload

Country review, person credit review, and movie metadata review are functioning systems. The remaining review items should be treated as editorial queue work, not as build failures.

### 5. Explore Surface Drift

Explore and Journey pages may not yet reflect the new relationship platform. Building on them before auditing could create a second exploration architecture.

## Recommended Next Priorities

### P0: Performance Stabilization Pass

Goal: make the current product feel fast before adding new surfaces.

Focus areas:

- Movie detail page query batching
- Director / Actor / Country detail loading
- Category and encyclopedia list pages
- Search overlay response time
- Avoiding N+1 entity lookups
- Request-level cache or server memoization where appropriate

Success criteria:

- Detail pages stop showing long rendering delays during normal navigation
- List pages do not hydrate every related entity one-by-one
- Existing verification suite still passes

### P1: Continue Journey UI Integration v1

Goal: turn the completed engine into visible product value.

Suggested scope:

- Movie detail Continue Journey panel
- Director detail Continue Journey panel
- Actor detail Continue Journey panel if supported through Person entity
- Country detail Continue Journey panel
- Movement detail Continue Journey panel

Use:

```text
Page
  -> Catalog Query / Entity Projection
  -> Continue Journey Engine
  -> Presentation component
```

Do not add recommendation logic. Every item must remain relationship-driven and explainable.

### P1: Relationship-Based Explore Audit

Goal: decide whether current Explore pages should be migrated, replaced, or preserved as a separate feature.

Deliverables:

- Existing Explore route map
- Data source audit
- Relationship Service fit assessment
- Migration plan for Atlas Explore Foundation

### P2: Editorial Review Workflow Hardening

Goal: keep data quality high without building a full admin dashboard yet.

Focus:

- Country review reports
- Person credit review reports
- Movie review queue
- Small editorial JSON updates
- Clear report summaries for manual review

### P2: Movement and Award Coverage Expansion

Goal: expand editorial knowledge only after the core graph/product flow is stable.

Recommended sequence:

1. Add more editorial movement and award records
2. Add curated relationships
3. Verify relationship policy coverage
4. Expose through search and Continue Journey

## Decision Rule for Future Sprints

Use this rule before accepting a new sprint:

1. If users feel slowness or broken navigation, fix performance or routing first.
2. If the feature needs relationships, use Relationship Service and Policy Engine.
3. If the feature needs recommendations, first prove it can be expressed as explainable relationships.
4. If the feature needs new data, add verification before UI.
5. If static data is involved, decide whether it is seed, fallback, sample, or deprecated.

## Recommended Immediate Sprint

The next sprint should be:

```text
Cinema Atlas - Performance Stabilization and Query Hydration Audit v1
```

Why:

- The user has already noticed rendering delays.
- The current architecture is now broad enough that performance issues can spread.
- Fixing performance before Explore or Continue Journey UI will make every later feature feel better.

Proposed first audit targets:

- `lib/catalogQuery.ts`
- detail routes under `app/movies`, `app/encyclopedia/directors`, `app/encyclopedia/actors`, and `app/encyclopedia/countries`
- card grids in encyclopedia list pages
- `PostgresCatalogRepository.getEntityById`
- repeated person/country/name lookup patterns

## Reference Documents

- `docs/data/POSTGRES_CATALOG_REPOSITORY_V1.md`
- `docs/data/CANONICAL_QUERY_INTEGRATION_PHASE_A.md`
- `docs/data/CANONICAL_CATALOG_EXPANSION_100.md`
- `docs/data/UNIFIED_SEARCH_FOUNDATION_V1.md`
- `docs/design/ENCYCLOPEDIA_VISUAL_IDENTITY_V1.md`
- `docs/architecture/relationship-types.md`
- `docs/architecture/relationship-repository.md`
- `docs/architecture/relationship-service.md`
- `docs/architecture/continue-journey.md`
- `docs/architecture/relationship-policy.md`

# Journey Candidate Backlog

The Journey backlog is the editorial staging area for generated and proposed
Cinema Atlas routes.

## Purpose

The backlog should create variety without lowering quality. It must avoid:

- the same Journey under a different title
- near-identical routes with only one film changed
- introductory titles attached to advanced routes
- category lists that feel like Encyclopedia lookup

## Candidate Quality Gates

Every active candidate is checked for:

- unique candidate id
- unique active title
- enough stops for its blueprint target
- film-forward structure
- no repeated anchors inside one route
- no active exact, near, or high-overlap duplicate
- title/difficulty consistency
- known anchor references

Archived candidates remain available as history, but they do not appear in the
generated Journey preview list.

## Current Backlog Shape

The current backlog keeps three archived duplicate candidates as evidence of the
duplicate-prevention rule, then adds five active approved candidates:

- Performance and Moral Pressure
- Modern Blockbuster Turn
- Festival Recognition Across Borders
- Family, Memory, and Modern Life
- Violence, Cities, and Social Pressure

One Korean contemporary cinema candidate remains in review until the catalog has
enough verified stops for a longer, film-forward route.

## Verification

Run:

```bash
npm run verify:journey-backlog
```

The verifier writes reports to:

```text
data/imports/journey-backlog/
```

It checks that the visible backlog has enough candidates, enough category
diversity, no duplicate active titles, no active similarity issues, and no
active naming/difficulty issues.

## Next Step

The next layer should improve candidate presentation and review workflow. The
backlog now has enough non-duplicate routes to support a richer Journey Library
without pretending that every generated candidate is ready for publication.

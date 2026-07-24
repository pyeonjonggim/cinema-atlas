# Journey Factory

Journey Factory is the first production layer for guided exploration.

It does not publish journeys automatically. It creates Journey candidates from
editorial blueprints and verifies whether those candidates are film-forward,
long enough, connected smoothly, and difficulty-scored.

Flow:

```text
Journey Blueprint
        ↓
Journey Factory
        ↓
Journey Candidate
        ↓
Verification Report
        ↓
Editorial Review
        ↓
Published Journey
```

Blueprints define intent, anchors, target length, minimum film count, and tags.
Candidates are generated output and should not become product content until
they pass review.

Rules:

- A Journey should be film-forward.
- Context stops should prepare the next film rather than replace films.
- Approved blueprints must generate publish-ready candidates.
- Draft and review blueprints may generate review items.
- Difficulty is computed by `lib/journeyDifficulty.ts`.
- No random generation is used.

This keeps Cinema Atlas aligned with the Product Bible: Curator over Algorithm,
Story First, Progressive Discovery, and One Journey at a Time.

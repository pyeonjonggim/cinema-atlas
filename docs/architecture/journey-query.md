# Journey Query Layer

Journey Query is the UI-facing read layer for Cinema Atlas Journeys.

Flow:

```text
Journey Repository
        ↓
Journey Query Service
        ↓
Explore / Journey Library / Journey Detail / Passport
        ↓
UI
```

Responsibilities:

- Return published public Journeys only.
- Hide draft, review, and archived Journey candidates from public UI.
- Return generated candidates through a separate editorial-preview query.
- Attach ordered Journey steps to each Journey projection.
- Provide deterministic featured Journey selection.
- Provide related Journey selection without page-level graph composition.
- Keep Passport Journey progress aligned with the same published source.

Rules:

- Pages do not import `data/journeys.ts` directly.
- Pages do not call Journey Repository directly.
- Journey candidates may exist in Repository but must not leak into public
  published read paths.
- Journey candidates can appear in explicitly labeled editorial preview surfaces.
- Components receive Journey projections and render them; they do not assemble
  Journey steps from static data.

The current Repository is in-memory, seeded from existing Journey data and
Factory candidates. The Query API is shaped so a future PostgreSQL Journey
Repository can replace it without changing page code.

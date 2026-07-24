# Journey Persistence

Journey Persistence prepares guided exploration for durable storage without
introducing a production database table yet.

Responsibilities:

- Store published Journey records.
- Store generated Journey candidates separately from published content.
- Preserve catalog status: draft, review, published, archived.
- Store ordered Journey steps with the Journey record.
- Support Saved Journey records without duplicating saves.
- Keep re-import idempotent.

Flow:

```text
Published Journey Data
        ↓
Journey Repository
        ↓
Published Catalog Journey

Journey Blueprint
        ↓
Journey Factory
        ↓
Journey Candidate
        ↓
Journey Repository
        ↓
Draft or Review Journey
```

Rules:

- Candidates are not automatically published.
- Ready-to-publish candidates still enter review.
- Published journeys must be public.
- Unpublished journeys must not be public.
- Saved Journey records are user-owned state and remain separate from Journey
  catalog records.
- Re-importing the same Journey data must not create duplicate Journey or Step
  records.

The current implementation uses `InMemoryJourneyRepository` for verification.
The API is intentionally shaped so a future PostgreSQL implementation can
replace it without changing Journey UI or Factory logic.

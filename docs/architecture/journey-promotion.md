# Journey Promotion

Journey Promotion is the editorial gate between generated Journey candidates
and public Cinema Atlas Journeys.

Flow:

```text
Journey Candidate
        ↓
Review Journey
        ↓
Editorial Decision
        ↓
Published Journey or Archived Journey
```

Rules:

- Factory candidates are never published automatically.
- Only review-status Journeys can be promoted.
- Promotion makes a Journey public and official.
- Draft candidates with validation issues must remain blocked.
- Rejection archives the Journey instead of deleting it.

This keeps Journey production aligned with Cinema Atlas as curator: generated
structure can help, but public routes require editorial approval.

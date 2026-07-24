# Journey Candidate Preview

Generated Journey candidates are editorial review records, not public Journey catalog records.

## Read Flow

```text
Journey blueprint
  -> Journey candidate
  -> Journey repository
  -> Journey query layer
  -> Candidate preview route
```

The preview route is:

```text
/explore/journeys/candidates/[candidateId]
```

It uses `getGeneratedJourneyCandidateById()` and rejects public Journey IDs. Published
Journey detail pages continue to use `getPublishedJourneyById()`.

## Product Boundary

Candidate previews may show draft and review-status Journeys so the editorial layer can
inspect sequence quality. They do not expose save actions, public promotion, or Journey
catalog status changes.

## Promotion Rule

Publication remains an explicit editorial decision. A candidate can appear in the public
Journey catalog only after the promotion layer marks it as:

```text
catalogStatus: published
visibility: public
official: true
```

## Current Guardrails

- Candidate cards link to preview pages, not public Journey detail pages.
- Candidate preview pages show editorial status and route structure.
- Public Journey lookup does not return generated candidates.
- Preview pages do not import static Journey data directly.
- Preview pages do not expose `SaveJourneyButton`.

## Next Step

The next layer should add editorial review actions such as keep in review, reject,
archive, or promote. Those actions should use the existing Journey Promotion service
rather than mutating candidate data in UI code.

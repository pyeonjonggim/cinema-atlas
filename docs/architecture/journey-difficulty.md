# Journey Difficulty Scoring

Journey difficulty is computed from the route itself, not assigned by feel.

The v1 score combines:

- Film count: more required films means more commitment.
- Movie accessibility: minor, specialist, or context-heavy films increase difficulty.
- Context complexity: more non-film stops and more entity types increase difficulty.
- Time commitment: longer journeys are harder to complete.
- Historical range: routes spanning many decades require more context switching.

Difficulty thresholds:

- Beginner: score below 45.
- Intermediate: score from 45 to 84.
- Advanced: score 85 and above.

The score itself is intentionally conservative in the product sense: scores
should stay low unless the route is genuinely demanding. Film count, specialist
cinema, long viewing time, and wide historical span can push the score upward,
but Advanced should remain rare. Beginner should mean a short and welcoming
doorway, not simply a famous subject.

Movie accessibility is an editorial hint, not a popularity algorithm. It exists so
Journey can distinguish a mainstream gateway film from a specialist canon film
without using personalization, ratings, or recommendation scoring.

The source of truth is `lib/journeyDifficulty.ts`. Journey data may declare a
difficulty, but `npm run verify:journey-difficulty` checks that the declaration
matches the computed score.

Adding more journeys should require data changes plus accessibility hints for
new film stops. Missing hints are reported as unknown rather than silently
treated as valid.

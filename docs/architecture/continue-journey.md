# Continue Journey Engine

The Continue Journey Engine is the first product engine built on the Cinema Atlas Relationship Platform.

```text
Entity
        ↓
Continue Journey Engine
        ↓
Relationship Service
        ↓
Relationship Repository
        ↓
Knowledge Graph
```

## Responsibility

The engine turns explicit relationship records into deterministic exploration suggestions. It does not decide what a user might like. It answers a narrower product question:

```text
Where should curiosity naturally lead next?
```

## Dependencies

The engine depends only on:

- Relationship Service
- Relationship Registry

It does not access SQL, repositories, page loaders, user history, search indexes, or UI components.

## Explainability

Every `ContinueJourneyItem` must include a structured `JourneyExplanation`. A suggestion without relationship-backed explanation data is invalid.

The explanation is domain data, not prose:

```text
Continue Journey Engine
        ↓
JourneyExplanation
        ↓
Journey Explanation Formatter
        ↓
Localized Presentation Text
```

The engine emits relationship type, source entity, target entity, and direction. It does not own English sentence structure.

`journeyExplanationFormatter.ts` owns presentation text. The formatter maps relationship semantics and direction to locale-aware output. v1 supports English and safely falls back to English for unsupported locales.

UI components must not reconstruct relationship explanation sentences independently.

## Deterministic Ordering

Ordering is stable and explainable:

1. Relationship class and registry order
2. Category
3. Relationship type
4. Entity type
5. Entity id

No popularity score, recommendation score, personalization, or machine learning is used.

## Future Expansion

Adding movies or entity instances requires no engine change.

Adding a relationship type requires updating the central relationship registry and adding a category/reason mapping if that relationship should appear in Continue Journey.

Adding future entity types should use the same entity reference contract. Do not create movie-specific or person-specific engine variants.

Future layers may build UI cards, route hydration, ranking, traversal, or personalization on top of this engine. Those concerns stay outside this foundation.

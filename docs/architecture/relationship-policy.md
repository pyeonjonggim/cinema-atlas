# Relationship Policy

The Relationship Policy Engine is the canonical presentation policy layer for Cinema Atlas relationships.

```text
Relationship Registry
        ↓
Relationship Policy Registry
        ↓
Relationship Policy Engine
        ↓
Continue Journey
        ↓
Explore More
        ↓
Atlas Explore
        ↓
Timeline
```

## Registry Responsibilities

The Relationship Registry defines relationship existence and validity:

- relationship type
- source entity type
- target entity type
- class
- direction
- metadata compatibility

It answers:

```text
What relationships exist?
```

## Policy Responsibilities

The Relationship Policy Registry defines how registered relationships should be presented and prioritized:

- visibility
- category
- group
- priority
- default appearance
- future feature support flags

It answers:

```text
Which relationships deserve attention?
```

## Policy Engine

`RelationshipPolicyEngine` exposes reusable policy queries:

- `getPolicy()`
- `getPolicies()`
- `isVisible()`
- `getPriority()`
- `getCategory()`
- `getGroup()`

The engine is declarative. It does not query SQL, access repositories, call the Relationship Service, rank by popularity, or personalize results.

## Separation Of Concerns

Continue Journey and future engines should not own presentation policy. They should request policy decisions from `RelationshipPolicyEngine`.

Adding a new relationship type requires:

1. Relationship Registry entry
2. Relationship Policy Registry entry
3. Optional formatter template if it appears in presentation text

Adding new movies or entity instances does not require policy changes.

## Future Reuse

The same policy layer is intended for:

- Continue Journey
- Explore More
- Atlas Explore
- Timeline
- Learning Paths
- Future recommendation systems

Those future systems may add feature-specific behavior on top, but relationship visibility, grouping, category, and priority remain centralized here.

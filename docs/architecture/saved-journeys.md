# Saved Journeys

Saved Journeys are the first return path for guided exploration.

Current flow:

```text
Journey Detail
        ↓
Save Journey
        ↓
Local Saved Journey Record
        ↓
Journey Library / My Atlas
        ↓
Continue Journey
```

Rules:

- Saved Journey state is user-owned state.
- Public Journey catalog data remains separate from saved state.
- The current v1 implementation uses localStorage.
- Journey Library and My Atlas both surface saved Journeys.
- Passport remains focused on history, milestones, and completed exploration
  records rather than saved intent.
- The storage key and change event are shared by SaveJourneyButton and
  SavedJourneyShelf.

Future persistence can replace localStorage with a user repository without
changing Journey catalog records.

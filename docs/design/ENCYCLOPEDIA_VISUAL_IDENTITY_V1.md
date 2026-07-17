# Encyclopedia Visual Identity v1

## Media Architecture

Cinema Atlas now separates provider media from editorial media.

Provider media:

- Movie poster
- Movie backdrop
- Person profile image

Editorial media:

- Country hero image
- Future movement hero image
- Future award hero image

The UI should not assemble provider URLs directly. TMDB paths are projected into `EntityImage` and resolved by the media layer.

## Media Model

Foundation file:

- `lib/media.ts`

Core fields:

- `kind`
- `source`
- `path`
- `url`
- `alt`
- `attribution`
- `objectPosition`

Supported presets:

- `poster-card`
- `poster-detail`
- `profile-card`
- `profile-hero`
- `backdrop-hero`
- `hero`

## Reusable Component

Component:

- `components/EntityImage.tsx`

Responsibilities:

- Uses `next/image`
- Resolves image URL through `resolveImageUrl`
- Handles image error fallback
- Maintains stable aspect ratio
- Provides designed fallback initials

## Applied Pages

Applied in this phase:

- Movie card poster
- Movie detail poster
- Movie detail backdrop
- Director detail profile image
- Actor detail profile image
- Country detail landscape hero foundation

## Country Editorial Media

Current local assets are limited. This phase applies a curated local image only where a suitable owned/local asset already exists.

Applied:

- Japan -> `/images/home/featured-journey-japan-desktop.webp`

Deferred:

- South Korea
- France
- Italy
- United States
- Iran
- Remaining countries

No unlicensed web images were downloaded or added.

## Fallback Rules

Missing media must not break layout.

- Movie fallback: cinema-card initials/fallback frame
- Person fallback: portrait-style fallback
- Country fallback: landscape/place tonal hero
- Movement fallback: abstract movement tone
- Award fallback: award tone

Fallbacks preserve layout dimensions.

## Accessibility

Rules:

- Poster alt: `Poster for {title}`
- Profile alt: `Portrait of {name}`
- Decorative backdrop alt is empty
- Hero text remains readable without images
- Image fallback includes accessible label

## Performance Rules

- Hero images may use `priority`
- Card images are lazy by default
- TMDB original-size images are not used
- Preset sizes determine requested image width
- Movie detail no longer loads full catalog data for related projections

## Current Limitations

- Director and Actor profile coverage depends on TMDB credit profile paths.
- Country editorial images need a licensed/owned curation pass.
- Movement and Award image fields are prepared conceptually but not curated in v1.
- Search overlay thumbnails are deferred.

## Verification

Command:

```bash
npm run verify:media
```

Checks:

- Movie poster coverage
- Person profile coverage
- Director/Actor profile coverage
- TMDB path shape
- Japan editorial asset existence
- Fallback policy presence


# Cinema Atlas Visual Bible v1

## 1. Brand Statement

Cinema Atlas helps people explore cinema as a world, not as a database. The interface should feel like opening a carefully edited field guide to film culture.

Core concept:

**Every Film Opens a New World.**

## 2. Core Emotion

The product should make users feel:

**Finding and following films is genuinely exciting.**

The experience should move from image to emotion, from emotion to story, from story to information, and from information to another connection.

## 3. Visual References

- National Geographic: exploration, photography, global scale.
- Lonely Planet: destinations, routes, guide-like clarity.
- Spotify: discovery flow and continuous next steps.
- Criterion: editorial attitude and film respect.
- Apple: restraint, spacing, polish.
- NASA / Earth: macro-to-micro movement from world to specific film.

These are references for principles, not assets. Do not copy external moodboard images into the repository.

## 4. Page Metaphors

- Home: Earth from Space
- Explore: Discovery Lobby
- Journey: Route Map
- Movie: Cinematic Exhibition
- Encyclopedia: Digital Museum
- Passport: Explorer Log
- My Atlas: Personal Cinema Archive

## 5. Image-First Principle

Cinema Atlas pages should begin with atmosphere, identity, or destination. Text explains the world after the image opens it.

Rules:

- Meaningful images need alt text.
- Background images require overlays.
- Image information must also be available as text.
- Fallbacks use gradient, subtle texture, and entity label.
- Avoid large "No Poster" or "No Image" text.

## 6. Macro To Micro

The product should support this movement:

World -> Country -> Movement -> Director -> Movie -> Personal Memory

Home and Explore should feel wider and more atmospheric. Movie, Journal, and My Atlas can become more intimate and specific.

## 7. Color Direction

Current semantic tokens live in `app/globals.css`.

Foundation:

- Background: warm black, not pure black.
- Text: off-white, not pure white.
- Surface: subtle translucent panels.
- Border: quiet, low-contrast dividers.
- Accent: alias token currently points to emerald.
- Deep blue remains a viable future accent direction.
- Gold is reserved for rare award/contextual moments, not default UI accent.

Important tokens:

- `--atlas-bg`
- `--atlas-bg-elevated`
- `--atlas-surface`
- `--atlas-surface-strong`
- `--atlas-text`
- `--atlas-text-muted`
- `--atlas-text-subtle`
- `--atlas-text-on-image`
- `--atlas-border`
- `--atlas-border-strong`
- `--atlas-accent`
- `--atlas-accent-hover`
- `--atlas-accent-soft`
- `--atlas-overlay-soft`
- `--atlas-overlay-strong`

## 8. Typography Hierarchy

Recommended semantic hierarchy:

- Display: rare, Home or major campaign-level moments.
- Hero Title: page identity and first emotional signal.
- Page Title: list and utility pages.
- Section Title: scannable editorial rhythm.
- Card Title: destination identity.
- Body Large: hero and feature descriptions.
- Body: readable long-form text.
- Metadata: compact facts, dates, counts, status.
- Eyebrow: quiet context, restrained letter spacing.
- CTA: clear action, never decorative.

Rules:

- Eyebrows use restrained letter spacing.
- Do not force every heading into uppercase.
- Card metadata must be visibly secondary.
- Encyclopedia body copy must remain readable.

## 9. Layout And Spacing

Current foundation:

- `PageContainer` keeps narrow/default/wide width API.
- Main content uses `max-w-5xl`, `max-w-7xl`, and `max-w-[90rem]`.
- Section gap should stay rhythmic and compact.
- Hero should be strong but should not push the next section too far away.
- Large images require enough air around them.

Migration should improve organization before deleting information.

## 10. Radius, Border, Shadow

Semantic radius tokens:

- `--atlas-radius-control`
- `--atlas-radius-card`
- `--atlas-radius-feature`
- `--atlas-radius-hero`

Rules:

- Cards rely mostly on border, not heavy shadow.
- Hover can use a tiny lift and soft shadow.
- Hero can use depth to separate image from content.
- Avoid glassmorphism and neon glow.

## 11. Hero Foundation

`UniversalHero` remains the shared top-level hero foundation.

Supported direction:

- `backgroundImage`
- `backgroundAlt`
- `imagePosition`
- `overlayStrength`
- `visualTone`
- `minHeight`
- `align`
- `mediaSlot`
- `metadata`
- `actions`

Hero structure:

Image / Atmosphere -> Eyebrow -> Title -> One-line Story -> Compact Metadata -> Optional Action

Rules:

- Hero is not a title box.
- Do not stack too much text on image.
- Overlay must protect readability.
- Use Next/Image for meaningful hero images.
- Use gradient fallback when no image exists.

## 12. Hero Variants

Variants are visual tones inside the same hero foundation, not separate hero systems.

- `world`: Home / Explore
- `cinematic`: Movie / Journey / Movement
- `place`: Country
- `portrait`: Director / Actor
- `archive`: Encyclopedia / Award
- `personal`: My Atlas
- `explorer`: Passport

## 13. Image Treatment

Movie:

- Backdrop creates atmosphere.
- Poster identifies the film.

Country:

- Use landscape, city, or cinema-context images.
- Avoid tourist-ad styling.

Director / Actor:

- Use portraits.
- Avoid excessive decoration.

Journey:

- Use a representative stop or cinematic still.
- Route/map motif is supporting, not primary.

Movement:

- Use representative still or period atmosphere.

Award:

- Use ceremony, theater, trophy, or institution imagery.

Passport:

- Use map, earth, route, log, or document motifs.
- Avoid game-panel language.

My Atlas:

- Use poster mosaic or personal archive motif.

## 14. Editorial Sections

`EditorialFeature` is the first foundation component for image-led editorial sections.

Supported layouts:

- image-left
- image-right
- full-bleed

Use cases:

- Home hero follow-up feature.
- Explore featured destination.
- Journey introduction.
- Official Collections preview.

Do not replace all grids with editorial sections. Use them when the section needs a stronger story.

## 15. Card Rules

Universal Card Language remains:

Image Slot -> Entity Label -> Primary Title -> Secondary Info -> Optional Metadata

Rules:

- Image is the first impression.
- Entity label is secondary.
- Title is the center.
- Metadata stays within 2-3 lines.
- Card itself is the destination.
- Avoid repeated CTA text inside every card.
- Hover uses small lift only.
- Image scale should be subtle.
- Avoid per-card arbitrary accent colors.

## 16. Motion Rules

Allowed:

- 150-250ms hover transition.
- Tiny card lift.
- Tiny image scale.
- Opacity transition.
- Reduced-motion support.

Deferred:

- Scroll reveal.
- Automatic carousel.
- Parallax.
- 3D globe.
- Page entrance animation.
- Long loading intro.
- Background video.

## 17. Accessibility Rules

- Meaningful image alt text is required.
- Decorative images use empty alt.
- Background image meaning must also be present as text.
- Overlay contrast must protect readability.
- Focus states must remain visible.
- Do not bake text into images.
- Respect reduced motion.
- CTA must not disappear into imagery.

## 18. Never List

Never make Cinema Atlas feel like:

- A streaming-first product.
- A gamified achievement menu.
- A social feed.
- A statistics dashboard.
- A neon entertainment app.
- A generic movie database.

## 19. Home Hero Audit

Current Home implementation:

- Route: `app/page.tsx`
- Hero component: `components/layout/BaseHero.tsx`
- Current content includes several legacy encoded strings that should be cleaned during Home migration.
- Home does not yet use `UniversalHero`.
- Image slot is not currently available in `BaseHero`.

Recommended next migration:

- Replace Home `BaseHero` usage with `UniversalHero`.
- Use `visualTone="world"`.
- Prepare Earth or planet-scale image asset through approved asset workflow.
- Keep existing Home section order during first visual pass.
- Move from text-first hero to image-first hero without adding 3D or video.

## 20. Migration Plan

Do not migrate everything at once.

Recommended order:

1. Home
2. Explore
3. Journey
4. Movie Detail
5. Country / Director / Encyclopedia Detail
6. Passport
7. My Atlas
8. List pages
9. Secondary detail pages

Each migration should include visual QA, responsive QA, lint, and build before moving on.

import type { Award } from "@/data/awards";
import type { Movement } from "@/data/movements";
import type { AwardEditorialEntity, MovementEditorialEntity } from "@/lib/editorial/entity";
import type { AwardProjection, MovementProjection } from "@/lib/editorial/projection";

const editorialSeedDate = new Date("2026-07-18T00:00:00.000Z");

function seedMetadata() {
  return {
    status: "published" as const,
    sourceType: "editorial" as const,
    revision: 1,
    createdAt: editorialSeedDate,
    updatedAt: editorialSeedDate,
  };
}

export function movementSeedToEditorialEntity(seed: Movement): MovementEditorialEntity {
  return {
    ...seedMetadata(),
    id: `movement:${seed.slug}`,
    slug: seed.slug,
    kind: "movement",
    name: seed.name,
    description: seed.description,
    whyItMatters: seed.whyMatters,
    period: seed.period,
    themes: seed.themes,
    characteristics: seed.characteristics,
    movieSlugs: seed.essentialMovieIds,
    directorSlugs: seed.directorSlugs,
    countrySlugs: seed.countrySlugs,
    relatedEntitySlugs: seed.relatedMovementSlugs,
    starterMovieSlug: seed.starterMovieId,
  };
}

export function awardSeedToEditorialEntity(seed: Award): AwardEditorialEntity {
  return {
    ...seedMetadata(),
    id: `award:${seed.slug}`,
    slug: seed.slug,
    kind: "award",
    name: seed.name,
    description: seed.description,
    whyItMatters: seed.whyMatters,
    organization: seed.organization,
    countrySlug: seed.countrySlug,
    foundedYear: seed.foundedYear,
    overview: seed.overview,
    movieSlugs: seed.representativeMovieIds,
    directorSlugs: seed.directorSlugs,
    starterMovieSlug: seed.starterMovieId,
  };
}

export function movementEntityToProjection(entity: MovementEditorialEntity): MovementProjection {
  return {
    slug: entity.slug,
    kind: "movement",
    name: entity.name,
    description: entity.description,
    whyItMatters: entity.whyItMatters,
    status: entity.status,
    sourceType: entity.sourceType,
    movieSlugs: entity.movieSlugs,
    directorSlugs: entity.directorSlugs,
    actorSlugs: entity.actorSlugs,
    countrySlugs: entity.countrySlugs,
    relatedEntitySlugs: entity.relatedEntitySlugs,
    period: entity.period,
    themes: entity.themes ?? [],
    characteristics: entity.characteristics ?? [],
    starterMovieSlug: entity.starterMovieSlug,
  };
}

export function awardEntityToProjection(entity: AwardEditorialEntity): AwardProjection {
  return {
    slug: entity.slug,
    kind: "award",
    name: entity.name,
    description: entity.description,
    whyItMatters: entity.whyItMatters,
    status: entity.status,
    sourceType: entity.sourceType,
    movieSlugs: entity.movieSlugs,
    directorSlugs: entity.directorSlugs,
    actorSlugs: entity.actorSlugs,
    countrySlugs: entity.countrySlugs,
    relatedEntitySlugs: entity.relatedEntitySlugs,
    organization: entity.organization,
    countrySlug: entity.countrySlug,
    foundedYear: entity.foundedYear,
    overview: entity.overview ?? [],
    starterMovieSlug: entity.starterMovieSlug,
  };
}
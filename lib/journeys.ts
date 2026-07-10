import { actors } from "@/data/actors";
import { awards } from "@/data/awards";
import { countries } from "@/data/countries";
import { directors } from "@/data/directors";
import { journeySteps, journeys } from "@/data/journeys";
import { movements } from "@/data/movements";
import { movies } from "@/data/movies";
import type { Journey, JourneyStep } from "@/types/journey";

export type ResolvedJourneyStep = JourneyStep & {
  title: string;
  subtitle?: string;
  href: string;
};

export function getJourneySteps(journey: Journey) {
  return journey.stepIds
    .map((stepId) => journeySteps.find((step) => step.id === stepId))
    .filter((step): step is JourneyStep => Boolean(step))
    .sort((a, b) => a.order - b.order);
}

export function resolveJourneyStep(step: JourneyStep): ResolvedJourneyStep {
  const fallback = {
    title: step.entityId,
    subtitle: step.entityType,
    href: getEntityHref(step.entityType, step.entityId),
  };

  if (step.entityType === "movie") {
    const movie = movies.find((item) => item.id === step.entityId);
    return {
      ...step,
      title: movie?.title ?? fallback.title,
      subtitle: movie ? String(movie.year) : fallback.subtitle,
      href: `/movies/${step.entityId}`,
    };
  }

  if (step.entityType === "director") {
    const director = directors.find((item) => item.slug === step.entityId);
    return {
      ...step,
      title: director?.name ?? fallback.title,
      subtitle: director?.country ?? fallback.subtitle,
      href: fallback.href,
    };
  }

  if (step.entityType === "actor") {
    const actor = actors.find((item) => item.slug === step.entityId);
    return {
      ...step,
      title: actor?.name ?? fallback.title,
      subtitle: actor?.countrySlug ?? fallback.subtitle,
      href: fallback.href,
    };
  }

  if (step.entityType === "country") {
    const country = countries.find((item) => item.slug === step.entityId);
    return {
      ...step,
      title: country?.name ?? fallback.title,
      subtitle: country?.region ?? fallback.subtitle,
      href: fallback.href,
    };
  }

  if (step.entityType === "movement") {
    const movement = movements.find((item) => item.slug === step.entityId);
    return {
      ...step,
      title: movement?.name ?? fallback.title,
      subtitle: movement?.period ?? fallback.subtitle,
      href: fallback.href,
    };
  }

  const award = awards.find((item) => item.slug === step.entityId);
  return {
    ...step,
    title: award?.name ?? fallback.title,
    subtitle: award?.organization ?? fallback.subtitle,
    href: fallback.href,
  };
}

export function getRelatedJourneys(currentJourney: Journey, limit = 4) {
  const currentSteps = getJourneySteps(currentJourney);
  const currentEntityIds = new Set(currentSteps.map((step) => step.entityId));
  const currentEntitiesByType = groupEntityIdsByType(currentSteps);

  return journeys
    .filter((journey) => journey.id !== currentJourney.id)
    .map((journey) => {
      const steps = getJourneySteps(journey);
      const entitiesByType = groupEntityIdsByType(steps);
      const sharedEntityCount = steps.filter((step) =>
        currentEntityIds.has(step.entityId)
      ).length;

      let score = 0;
      if (journey.category === currentJourney.category) score += 30;
      score += countShared(currentEntitiesByType.country, entitiesByType.country) * 18;
      score += countShared(currentEntitiesByType.movement, entitiesByType.movement) * 16;
      score += countShared(currentEntitiesByType.director, entitiesByType.director) * 14;
      if (journey.difficulty === currentJourney.difficulty) score += 8;
      score += sharedEntityCount * 2;

      const overlapRatio =
        steps.length > 0 ? sharedEntityCount / Math.max(steps.length, 1) : 0;
      if (overlapRatio > 0.5) score -= 20;

      return { journey, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.journey.title.localeCompare(b.journey.title);
    })
    .map((item) => item.journey)
    .slice(0, limit);
}

export function getEntityHref(
  entityType: JourneyStep["entityType"],
  entityId: string
) {
  if (entityType === "movie") return `/movies/${entityId}`;
  return `/encyclopedia/${getEntityPath(entityType)}/${entityId}`;
}

function groupEntityIdsByType(steps: JourneyStep[]) {
  return steps.reduce(
    (groups, step) => {
      groups[step.entityType].add(step.entityId);
      return groups;
    },
    {
      movie: new Set<string>(),
      director: new Set<string>(),
      actor: new Set<string>(),
      country: new Set<string>(),
      movement: new Set<string>(),
      award: new Set<string>(),
    }
  );
}

function countShared(left: Set<string>, right: Set<string>) {
  let count = 0;
  left.forEach((value) => {
    if (right.has(value)) count += 1;
  });
  return count;
}

function getEntityPath(entityType: JourneyStep["entityType"]) {
  const paths = {
    director: "directors",
    actor: "actors",
    country: "countries",
    movement: "movements",
    award: "awards",
  };

  return paths[entityType as keyof typeof paths];
}

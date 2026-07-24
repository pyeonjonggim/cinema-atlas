import "server-only";

import { formatJourneyExplanation } from "@/lib/relationships/journeyExplanationFormatter";
import type { EntityContinueJourneyItem } from "@/components/patterns/EntityContinueJourneyPattern";
import type { ContinueJourneyItem, ContinueJourneyResult } from "@/types/continueJourney";
import type { RelationshipEntityType } from "@/types/relationship";

type ContinueJourneyLabelMap = Partial<Record<RelationshipEntityType, Record<string, string | undefined>>>;

type ContinueJourneyHrefMap = Partial<Record<RelationshipEntityType, Record<string, string | undefined>>>;

type ContinueJourneyPresentationOptions = {
  labels?: ContinueJourneyLabelMap;
  hrefs?: ContinueJourneyHrefMap;
  limit?: number;
};

function titleize(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function entityLabel(
  entityType: RelationshipEntityType,
  entityId: string,
  labels?: ContinueJourneyLabelMap,
): string {
  return labels?.[entityType]?.[entityId] ?? titleize(entityId);
}

function personHref(item: ContinueJourneyItem): string {
  if (item.relationshipType === "MOVIE_ACTED_BY_PERSON") {
    return `/encyclopedia/actors/${item.entityId}`;
  }
  return `/encyclopedia/directors/${item.entityId}`;
}

function defaultHref(item: ContinueJourneyItem): string {
  if (item.entityType === "MOVIE") return `/movies/${item.entityId}`;
  if (item.entityType === "PERSON") return personHref(item);
  if (item.entityType === "COUNTRY") return `/encyclopedia/countries/${item.entityId}`;
  if (item.entityType === "MOVEMENT") return `/encyclopedia/movements/${item.entityId}`;
  if (item.entityType === "AWARD") return `/encyclopedia/awards/${item.entityId}`;
  return "/encyclopedia";
}

function level(index: number): EntityContinueJourneyItem["level"] {
  if (index === 0) return "primary";
  if (index >= 3) return "deep";
  return "secondary";
}

function withExplanationLabels(
  item: ContinueJourneyItem,
  labels?: ContinueJourneyLabelMap,
): ContinueJourneyItem["explanation"] {
  return {
    ...item.explanation,
    source: {
      ...item.explanation.source,
      label: entityLabel(
        item.explanation.source.entityType,
        item.explanation.source.id,
        labels,
      ),
    },
    target: {
      ...item.explanation.target,
      label: entityLabel(
        item.explanation.target.entityType,
        item.explanation.target.id,
        labels,
      ),
    },
  };
}

export function projectContinueJourneyItems(
  result: ContinueJourneyResult,
  options: ContinueJourneyPresentationOptions = {},
): EntityContinueJourneyItem[] {
  if (!result.supported) return [];

  return result.items
    .slice(0, options.limit ?? 4)
    .map((item, index) => {
      const title = entityLabel(item.entityType, item.entityId, options.labels);
      const href = options.hrefs?.[item.entityType]?.[item.entityId] ?? defaultHref(item);

      return {
        label: item.subtitle ?? item.category,
        title,
        href,
        description: formatJourneyExplanation(withExplanationLabels(item, options.labels)),
        level: level(index),
      };
    });
}

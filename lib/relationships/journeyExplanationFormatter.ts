import type { JourneyExplanation } from "@/types/continueJourney";

export type JourneyExplanationFormatOptions = {
  locale?: string;
};

type JourneyExplanationTemplate = {
  relationshipType: string;
  directTemplate: string;
  inverseTemplate?: string;
};

export const journeyExplanationTemplates: JourneyExplanationTemplate[] = [
  {
    relationshipType: "MOVIE_DIRECTED_BY_PERSON",
    directTemplate: "Directed by {target}",
    inverseTemplate: "A film directed by {target}",
  },
  {
    relationshipType: "MOVIE_ACTED_BY_PERSON",
    directTemplate: "Features {target}",
    inverseTemplate: "A film featuring {target}",
  },
  {
    relationshipType: "MOVIE_WRITTEN_BY_PERSON",
    directTemplate: "Written by {target}",
    inverseTemplate: "A film written by {target}",
  },
  {
    relationshipType: "MOVIE_PRODUCED_BY_PERSON",
    directTemplate: "Produced by {target}",
    inverseTemplate: "A film produced by {target}",
  },
  {
    relationshipType: "MOVIE_PRODUCED_IN_COUNTRY",
    directTemplate: "Produced in {target}",
    inverseTemplate: "A film from {target}",
  },
  {
    relationshipType: "MOVIE_HAS_GENRE",
    directTemplate: "Associated with {target}",
    inverseTemplate: "A film associated with {target}",
  },
  {
    relationshipType: "MOVIE_USES_LANGUAGE",
    directTemplate: "Uses {target}",
    inverseTemplate: "A film using {target}",
  },
  {
    relationshipType: "MOVIE_PRODUCED_BY_COMPANY",
    directTemplate: "Produced by {target}",
    inverseTemplate: "A film produced by {target}",
  },
  {
    relationshipType: "MOVIE_PART_OF_MOVEMENT",
    directTemplate: "Associated with {target}",
    inverseTemplate: "A film associated with {target}",
  },
  {
    relationshipType: "MOVIE_WON_AWARD",
    directTemplate: "Recognized by {target}",
    inverseTemplate: "A film recognized by {target}",
  },
];

function label(value: JourneyExplanation["source"]): string {
  return value.label ?? value.id.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function render(template: string, explanation: JourneyExplanation): string {
  return template
    .replaceAll("{source}", label(explanation.source))
    .replaceAll("{target}", label(explanation.target));
}

export function formatJourneyExplanation(
  explanation: JourneyExplanation,
  options: JourneyExplanationFormatOptions = {},
): string {
  const locale = options.locale ?? "en";
  const template = journeyExplanationTemplates.find((item) =>
    item.relationshipType === explanation.relationshipType,
  );
  const isInverse = explanation.kind === "INVERSE_RELATIONSHIP";
  const fallback = isInverse ? "Connected from {source}" : "Connected to {target}";

  if (locale !== "en") {
    return render((isInverse ? template?.inverseTemplate : template?.directTemplate) ?? fallback, explanation);
  }

  return render((isInverse ? template?.inverseTemplate : template?.directTemplate) ?? fallback, explanation);
}

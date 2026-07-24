import type {
  JourneyCatalogStatus,
  JourneyRecord,
  JourneyRepository,
} from "@/types/journey";

export type JourneyPromotionDecision =
  | "promote"
  | "keep-in-review"
  | "reject";

export type JourneyPromotionInput = {
  journeyId: string;
  decision: JourneyPromotionDecision;
  reason: string;
  reviewedBy: "cinema-atlas-editorial";
  reviewedAt: string;
};

export type JourneyPromotionResult = {
  journeyId: string;
  previousStatus: JourneyCatalogStatus;
  nextStatus: JourneyCatalogStatus;
  promoted: boolean;
  reason: string;
};

export async function applyJourneyPromotionDecision(
  repository: JourneyRepository,
  input: JourneyPromotionInput
): Promise<JourneyPromotionResult> {
  const journey = await repository.getJourneyById(input.journeyId);

  if (!journey) {
    throw new Error(`Journey does not exist: ${input.journeyId}`);
  }

  const nextStatus = getNextStatus(input.decision);

  if (input.decision === "promote") {
    assertPromotable(journey);
  }

  const updated =
    input.decision === "promote"
      ? await repository.publishJourney(input.journeyId)
      : await repository.updateJourneyStatus(input.journeyId, nextStatus);

  return {
    journeyId: updated.id,
    previousStatus: journey.catalogStatus,
    nextStatus: updated.catalogStatus,
    promoted: updated.catalogStatus === "published",
    reason: input.reason,
  };
}

export function assertPromotable(journey: JourneyRecord) {
  if (journey.catalogStatus !== "review") {
    throw new Error(`Journey is not in review: ${journey.id}`);
  }

  if (journey.visibility === "public") {
    throw new Error(`Review Journey is already public: ${journey.id}`);
  }

  if (journey.stepIds.length < 8) {
    throw new Error(`Journey is too short to publish: ${journey.id}`);
  }

  if (journey.estimatedMovies < Math.ceil(journey.stepIds.length / 2)) {
    throw new Error(`Journey is not film-forward enough to publish: ${journey.id}`);
  }
}

function getNextStatus(decision: JourneyPromotionDecision): JourneyCatalogStatus {
  if (decision === "promote") return "published";
  if (decision === "reject") return "archived";
  return "review";
}

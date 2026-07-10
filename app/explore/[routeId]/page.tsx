import { redirect } from "next/navigation";

import { journeys } from "@/data/journeys";

const legacyJourneyMap: Record<string, string> = {
  "japanese-cinema-starter": "intro-japanese-cinema",
  "new-hollywood-power-path": "new-hollywood-foundations",
  "academy-best-picture-path": "oscar-winners",
};

type LegacyExploreRoutePageProps = {
  params: Promise<{
    routeId: string;
  }>;
};

export default async function LegacyExploreRoutePage({
  params,
}: LegacyExploreRoutePageProps) {
  const { routeId } = await params;
  const mappedJourneyId = legacyJourneyMap[routeId] ?? routeId;
  const journey = journeys.find((item) => item.id === mappedJourneyId);

  if (journey) {
    redirect(`/explore/journeys/${journey.id}`);
  }

  redirect("/explore/journeys");
}

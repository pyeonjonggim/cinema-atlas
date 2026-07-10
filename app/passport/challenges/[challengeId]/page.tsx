import { notFound } from "next/navigation";

import ChallengeDetailPage from "@/components/pages/ChallengeDetailPage";
import {
  achievements,
  challenges,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { officialJourneys } from "@/data/journeys";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { buildPassportModel } from "@/lib/passport";

type ChallengeRouteProps = {
  params: Promise<{
    challengeId: string;
  }>;
};

export default async function ChallengeRoute({ params }: ChallengeRouteProps) {
  const { challengeId } = await params;
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    journeys: officialJourneys,
  });
  const progress = passport.challengeLibrary.find(
    (item) => item.challenge.id === challengeId
  );

  if (!progress) {
    notFound();
  }

  return <ChallengeDetailPage progress={progress} />;
}

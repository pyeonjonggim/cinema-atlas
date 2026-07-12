import { notFound } from "next/navigation";

import AchievementDetailPage from "@/components/pages/AchievementDetailPage";
import { officialJourneys } from "@/data/journeys";
import { movies } from "@/data/movies";
import {
  achievements,
  challenges,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { userMovies } from "@/data/userMovies";
import { buildPassportModel } from "@/lib/passport";

type AchievementRouteProps = {
  params: Promise<{
    achievementId: string;
  }>;
};

export default async function AchievementRoute({
  params,
}: AchievementRouteProps) {
  const { achievementId } = await params;
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    journeys: officialJourneys,
  });
  const achievement = passport.achievementGallery.find(
    (item) => item.achievement.id === achievementId
  );

  if (!achievement) {
    notFound();
  }

  return <AchievementDetailPage achievement={achievement} />;
}

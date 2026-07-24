import PassportMilestonesPage from "@/components/pages/PassportMilestonesPage";
import { journalEntries } from "@/data/journalEntries";
import { movies } from "@/data/movies";
import {
  achievements,
  challenges,
  milestones,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { userMovies } from "@/data/userMovies";
import { listPublishedJourneys } from "@/lib/journeyQuery";
import { buildPassportModel } from "@/lib/passport";

export default async function MilestonesRoute() {
  const journeys = await listPublishedJourneys();
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    milestones,
    journalEntries,
    journeys,
  });

  return <PassportMilestonesPage milestones={passport.milestoneProgress} />;
}

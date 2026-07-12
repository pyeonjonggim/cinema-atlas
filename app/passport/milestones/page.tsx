import PassportMilestonesPage from "@/components/pages/PassportMilestonesPage";
import { officialJourneys } from "@/data/journeys";
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
import { buildPassportModel } from "@/lib/passport";

export default function MilestonesRoute() {
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
    milestones,
    journalEntries,
    journeys: officialJourneys,
  });

  return <PassportMilestonesPage milestones={passport.milestoneProgress} />;
}

import MyPassportPage from "@/components/pages/MyPassportPage";
import { countries } from "@/data/countries";
import {
  achievements,
  challenges,
  milestones,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { journalEntries } from "@/data/journalEntries";
import { listPublishedJourneys } from "@/lib/journeyQuery";

export default async function PassportRoute() {
  const journeys = await listPublishedJourneys();

  return (
    <MyPassportPage
      movies={movies}
      userMovies={userMovies}
      challenges={challenges}
      userChallenges={userChallenges}
      achievements={achievements}
      userAchievements={userAchievements}
      milestones={milestones}
      journalEntries={journalEntries}
      journeys={journeys}
      countries={countries}
    />
  );
}

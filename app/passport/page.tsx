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
import { officialJourneys } from "@/data/journeys";
import { journalEntries } from "@/data/journalEntries";

export default function PassportRoute() {
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
      journeys={officialJourneys}
      countries={countries}
    />
  );
}

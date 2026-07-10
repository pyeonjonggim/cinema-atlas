import MyPassportPage from "@/components/pages/MyPassportPage";
import {
  achievements,
  challenges,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { officialJourneys } from "@/data/journeys";

export default function PassportRoute() {
  return (
    <MyPassportPage
      movies={movies}
      userMovies={userMovies}
      challenges={challenges}
      userChallenges={userChallenges}
      achievements={achievements}
      userAchievements={userAchievements}
      journeys={officialJourneys}
    />
  );
}

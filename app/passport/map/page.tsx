import PassportExplorerMapPage from "@/components/pages/PassportExplorerMapPage";
import { countries } from "@/data/countries";
import { journalEntries } from "@/data/journalEntries";
import { officialJourneys } from "@/data/journeys";
import {
  achievements,
  challenges,
  milestones,
  userAchievements,
  userChallenges,
} from "@/data/passport";
import { movies } from "@/data/movies";
import { userMovies } from "@/data/userMovies";
import { buildPassportModel } from "@/lib/passport";

export default function PassportMapRoute() {
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
    countries,
  });

  return (
    <PassportExplorerMapPage
      countries={passport.explorerCountries}
      regions={passport.explorerRegions}
      movies={movies}
      userMovies={userMovies}
    />
  );
}

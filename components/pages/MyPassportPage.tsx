import AchievementCard from "@/components/passport/AchievementCard";
import ChallengeCard from "@/components/passport/ChallengeCard";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import { buildPassportModel } from "@/lib/passport";
import type { Movie } from "@/types/movie";
import type {
  Achievement,
  Challenge,
  UserAchievement,
  UserChallenge,
} from "@/types/passport";
import type { UserMovie } from "@/types/userMovie";

type MyPassportPageProps = {
  movies: Movie[];
  userMovies: UserMovie[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
};

export default function MyPassportPage({
  movies,
  userMovies,
  challenges,
  userChallenges,
  achievements,
  userAchievements,
}: MyPassportPageProps) {
  const passport = buildPassportModel({
    movies,
    userMovies,
    challenges,
    userChallenges,
    achievements,
    userAchievements,
  });
  const primaryChallenge = passport.activeChallenges[0];

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow="Passport"
            title="Cinema Atlas Passport"
            description="Explore. Learn. Master. Passport is the exploration system of Cinema Atlas, connecting challenges, achievements, journeys, and future maps."
          />

          <Section
            title="Active Challenges"
            description="Current exploration goals selected for your Passport."
            className="p-4 md:p-5"
          >
            {passport.activeChallenges.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {passport.activeChallenges.map((progress) => (
                  <ChallengeCard key={progress.challenge.id} progress={progress} />
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No active challenge yet."
                description="Choose a challenge from the library to begin a focused journey."
              />
            )}
          </Section>

          <Section
            title="Latest Achievements"
            description="Achievements are completed footsteps, not current goals."
            className="p-4 md:p-5"
          >
            {passport.latestAchievements.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {passport.latestAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.achievement.id}
                    achievement={achievement}
                    compact
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No achievement unlocked yet."
                description="Complete a challenge and your first badge will appear here."
              />
            )}
          </Section>

          <Section
            title="Explorer Map"
            description="A future map of cinematic worlds explored through Passport."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Japan", "68%"],
                ["France", "34%"],
                ["Iran", "12%"],
                ["Brazil", "0%"],
              ].map(([label, value]) => (
                <AtlasCard key={label} className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    World Exploration
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
                  <p className="mt-3 text-sm text-neutral-400">{value}</p>
                </AtlasCard>
              ))}
            </div>
          </Section>

          <Section
            title="Journey Library"
            description="Official journeys will become structured paths through Passport."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {["World Cinema", "Japanese Cinema", "New Hollywood", "Oscar Winners"].map(
                (title) => (
                  <AtlasCard key={title} className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Official Journey
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      Journey structure arrives in a future Passport sprint.
                    </p>
                  </AtlasCard>
                )
              )}
            </div>
          </Section>

          <Section
            title="Challenge Library"
            description="All challenges remain open. Nothing is locked."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {passport.challengeLibrary.map((progress) => (
                <ChallengeCard
                  key={progress.challenge.id}
                  progress={progress}
                  compact
                />
              ))}
            </div>
          </Section>

          <Section
            title="Achievement Gallery"
            description="Unlocked achievements show dates. Locked achievements show the journey still waiting."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {passport.achievementGallery.map((achievement) => (
                <AchievementCard
                  key={achievement.achievement.id}
                  achievement={achievement}
                />
              ))}
            </div>
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Passport should always point back toward a meaningful next destination."
            items={[
              {
                label: "Challenge",
                title: primaryChallenge
                  ? `Continue ${primaryChallenge.challenge.targetLabel}`
                  : "Start a Challenge",
                description: primaryChallenge
                  ? `${primaryChallenge.current} of ${primaryChallenge.target} recorded so far.`
                  : "Choose a challenge and begin a new exploration path.",
                href: primaryChallenge
                  ? getChallengeHref(primaryChallenge.challenge)
                  : "/explore",
                level: "primary",
              },
              {
                label: "Explore",
                title: "Find a Curated Journey",
                description: "Move from Passport progress into a guided cinema path.",
                href: "/explore",
              },
              {
                label: "Encyclopedia",
                title: "Browse Movies",
                description: "Open another film and add a new stamp to the journey.",
                href: "/encyclopedia/movies",
                level: "deep",
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  );
}

function getChallengeHref(challenge: Challenge) {
  if (!challenge.targetId) return "/explore";

  if (challenge.category === "country") {
    return `/encyclopedia/countries/${challenge.targetId}`;
  }

  if (challenge.category === "director") {
    return `/encyclopedia/directors/${challenge.targetId}`;
  }

  if (challenge.category === "movement") {
    return `/encyclopedia/movements/${challenge.targetId}`;
  }

  if (challenge.category === "award") {
    return `/encyclopedia/awards/${challenge.targetId}`;
  }

  return "/encyclopedia/movies";
}

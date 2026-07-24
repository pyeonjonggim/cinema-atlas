import AchievementCard from "@/components/passport/AchievementCard";
import ChallengeCard from "@/components/passport/ChallengeCard";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import EmptyState from "@/components/ui/EmptyState";
import { buildPassportModel } from "@/lib/passport";
import type { Country } from "@/data/countries";
import type { JournalEntry } from "@/types/journal";
import type { Journey, JourneyProjection } from "@/types/journey";
import type { Movie } from "@/types/movie";
import type {
  Achievement,
  Challenge,
  Milestone,
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
  milestones: Milestone[];
  journalEntries: JournalEntry[];
  journeys: (Journey | JourneyProjection)[];
  countries: Country[];
};

export default function MyPassportPage({
  movies,
  userMovies,
  challenges,
  userChallenges,
  achievements,
  userAchievements,
  milestones,
  journalEntries,
  journeys,
  countries,
}: MyPassportPageProps) {
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
    countries,
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
            description="Explore, learn, and remember where cinema has taken you. Passport connects challenges, achievements, journeys, and future maps."
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
                title="No achievement recorded yet."
                description="Complete a challenge and your first exploration record will appear here."
              />
            )}
          </Section>

          <Section
            title="Milestones"
            description="Long-term growth markers across your Passport."
            action={<AtlasButton href="/passport/milestones" variant="secondary">View All Milestones</AtlasButton>}
            className="p-4 md:p-5"
          >
            {passport.milestoneProgress.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {passport.milestoneProgress.slice(0, 3).map((progress) => (
                  <AtlasCard key={progress.milestone.id} href="/passport/milestones" className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {progress.completed ? "Completed" : "In Progress"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {progress.milestone.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
                      <span>{progress.milestone.unit}</span>
                      <span>
                        {progress.current} / {progress.target}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/40"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </AtlasCard>
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No milestones yet."
                description="Milestones will appear as long-term Passport growth markers."
              />
            )}
          </Section>

          <Section
            title="Journey Progress"
            description="Track your guided explorations. Journeys begin in Explore and your progress is remembered here."
            action={<AtlasButton href="/explore/journeys" variant="secondary">Browse Journeys</AtlasButton>}
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {passport.journeyProgress.map((progress) => (
                <AtlasCard
                  key={progress.journey.id}
                  href={progress.href}
                  className="p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {progress.status.replace("-", " ")}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {progress.journey.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
                    {progress.journey.subtitle}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
                    <span>Movie stops</span>
                    <span>
                      {progress.completedSteps} / {progress.totalSteps}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/40"
                      style={{
                        width:
                          progress.totalSteps > 0
                            ? `${Math.round(
                                (progress.completedSteps / progress.totalSteps) * 100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </AtlasCard>
              ))}
            </div>
          </Section>

          <Section
            title="Explorer Map"
            description="Known catalog progress by country, built from completed films."
            action={<AtlasButton href="/passport/map" variant="secondary">Explore the Map</AtlasButton>}
            className="p-4 md:p-5"
          >
            {passport.explorerCountries.some((country) => country.watchedCount > 0) ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {passport.explorerCountries
                  .filter((country) => country.watchedCount > 0)
                  .slice(0, 4)
                  .map((country) => (
                    <AtlasCard
                      key={country.countryId}
                      href={`/encyclopedia/countries/${country.countryId}`}
                      className="p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        {country.status}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {country.countryName}
                      </h3>
                      <p className="mt-3 text-sm text-neutral-400">
                        {country.watchedCount} films / {country.directorCount} directors
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {country.progressPercent}% Cinema Atlas catalog progress
                      </p>
                    </AtlasCard>
                  ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No countries explored yet."
                description="Start with a country, film, or guided journey."
                actionLabel="Explore Countries"
                actionHref="/encyclopedia/countries"
              />
            )}
          </Section>

          <Section
            title="Recent Passport History"
            description="Passport History records exploration events, not every watched movie."
            action={<AtlasButton href="/passport/history" variant="secondary">View Full History</AtlasButton>}
            className="p-4 md:p-5"
          >
            {passport.passportHistory.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {passport.passportHistory.slice(0, 3).map((event) => (
                  <AtlasCard key={event.id} href={event.href} className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-white">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">{event.date}</p>
                  </AtlasCard>
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No Passport history yet."
                description="Challenge, Achievement, and Milestone events will appear here."
              />
            )}
          </Section>

          <Section
            title="Challenge Library"
            description="All available goals remain visible. Choose the next exploration target when you are ready."
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
            description="Recorded achievements show dates. Future achievements show the journey still waiting."
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

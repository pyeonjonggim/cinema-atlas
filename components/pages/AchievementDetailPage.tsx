import AchievementEvidenceList from "@/components/passport/AchievementEvidenceList";
import AchievementRequirementList from "@/components/passport/AchievementRequirementList";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import type { AchievementProgress } from "@/lib/passport";
import type { ChallengeCategory } from "@/types/passport";

type AchievementDetailPageProps = {
  achievement: AchievementProgress;
};

export default function AchievementDetailPage({
  achievement,
}: AchievementDetailPageProps) {
  const record = achievement.achievement;
  const relatedChallenge = achievement.linkedChallenge;
  const relatedEncyclopedia = buildRelatedEncyclopedia(achievement);

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow={`${record.category} achievement`}
            title={record.title}
            description={record.description}
            stats={
              <div className="flex flex-wrap gap-2">
                <HeroPill label={achievement.unlocked ? "Unlocked" : "Locked"} />
                <HeroPill label={formatCategory(record.category)} />
                {achievement.unlockedAt && (
                  <HeroPill label={`Unlocked ${achievement.unlockedAt}`} />
                )}
              </div>
            }
          />

          <Section
            title="Achievement Overview"
            description="Achievements are permanent records of completed exploration. They remember where your Passport has already been."
            className="p-4 md:p-5"
          >
            <p className="max-w-3xl text-sm leading-7 text-neutral-300">
              {record.description} This record exists to preserve the films and
              context that made the exploration meaningful, not to create a
              reward loop.
            </p>
          </Section>

          <Section
            title={achievement.unlocked ? "Unlocked Evidence" : "Missing Progress"}
            description={
              achievement.unlocked
                ? "The records that unlocked this Achievement."
                : "The remaining steps before this Achievement becomes part of your Passport history."
            }
            className="p-4 md:p-5"
          >
            {achievement.unlocked ? (
              <AchievementEvidenceList movies={achievement.evidenceMovies} />
            ) : (
              <AchievementRequirementList
                requirements={achievement.missingRequirements}
              />
            )}
          </Section>

          {relatedChallenge && (
            <Section
              title="Related Challenge"
              description="Challenges are current goals. Achievements are the record they leave behind."
              className="p-4 md:p-5"
            >
              <AtlasCard
                href={`/passport/challenges/${relatedChallenge.challenge.id}`}
                className="p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {relatedChallenge.status} challenge
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {relatedChallenge.challenge.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  {relatedChallenge.current} of {relatedChallenge.target} records
                  complete.
                </p>
              </AtlasCard>
            </Section>
          )}

          <Section
            title="Related Movies"
            description="Films directly connected to this record."
            className="p-4 md:p-5"
          >
            <AchievementEvidenceList movies={achievement.relatedMovies} />
          </Section>

          {relatedEncyclopedia.length > 0 && (
            <Section
              title="Related Encyclopedia"
              description="Context that explains why this Achievement matters."
              className="p-4 md:p-5"
            >
              <div className="grid gap-3 md:grid-cols-3">
                {relatedEncyclopedia.map((item) => (
                  <AtlasCard key={item.href} href={item.href} className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      {item.description}
                    </p>
                  </AtlasCard>
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Continue Exploring"
            description="Use this record as the beginning of another path."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <AtlasCard href="/explore/journeys" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Journey
                </p>
                <h3 className="mt-2 font-semibold text-white">
                  Browse Guided Journeys
                </h3>
              </AtlasCard>
              <AtlasCard href="/passport" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Passport
                </p>
                <h3 className="mt-2 font-semibold text-white">
                  Return to Passport
                </h3>
              </AtlasCard>
              <AtlasCard href="/encyclopedia" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Encyclopedia
                </p>
                <h3 className="mt-2 font-semibold text-white">
                  Browse Connected Knowledge
                </h3>
              </AtlasCard>
            </div>
          </Section>

          <div className="flex justify-start">
            <AtlasButton href="/passport" variant="secondary">
              Back to Passport
            </AtlasButton>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-300">
      {label}
    </span>
  );
}

function buildRelatedEncyclopedia(achievement: AchievementProgress) {
  const challenge = achievement.linkedChallenge?.challenge;
  const firstMovie = achievement.relatedMovies[0];
  const items: Array<{
    label: string;
    title: string;
    description: string;
    href: string;
  }> = [];

  if (challenge) {
    items.push({
      label: formatCategory(challenge.category),
      title: challenge.targetLabel,
      description: "The primary context behind this Achievement.",
      href: getChallengeHref(challenge.category, challenge.targetId),
    });
  }

  if (firstMovie) {
    items.push(
      {
        label: "Director",
        title: firstMovie.director,
        description: "Follow the authorship connected to this record.",
        href: `/encyclopedia/directors/${firstMovie.directorSlug}`,
      },
      {
        label: "Country",
        title: firstMovie.country,
        description: "Open the cinematic context behind the films.",
        href: `/encyclopedia/countries/${firstMovie.countrySlug}`,
      },
      {
        label: "Movement",
        title: firstMovie.movement,
        description: "Connect this record to a larger film history path.",
        href: `/encyclopedia/movements/${firstMovie.movementSlug}`,
      }
    );
  }

  return items
    .filter((item, index, list) => list.findIndex((entry) => entry.href === item.href) === index)
    .slice(0, 3);
}

function getChallengeHref(category: ChallengeCategory, targetId?: string) {
  if (!targetId) return "/encyclopedia";
  if (category === "country") return `/encyclopedia/countries/${targetId}`;
  if (category === "director") return `/encyclopedia/directors/${targetId}`;
  if (category === "movement") return `/encyclopedia/movements/${targetId}`;
  if (category === "actor") return `/encyclopedia/actors/${targetId}`;
  if (category === "award") return `/encyclopedia/awards/${targetId}`;
  return "/encyclopedia/movies";
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

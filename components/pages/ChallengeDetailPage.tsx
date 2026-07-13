import ChallengeEvidenceList from "@/components/passport/ChallengeEvidenceList";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import type { ChallengeProgress } from "@/lib/passport";

type ChallengeDetailPageProps = {
  progress: ChallengeProgress;
};

export default function ChallengeDetailPage({
  progress,
}: ChallengeDetailPageProps) {
  const { challenge } = progress;
  const primarySuggestion = progress.suggestedNext[0];

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow={`${challenge.category} challenge`}
            title={challenge.title}
            description={challenge.description}
            stats={
              <div className="flex flex-wrap gap-2">
                <HeroPill label={challenge.difficulty} />
                <HeroPill label={progress.status} />
                <HeroPill label={`${progress.current} / ${progress.target}`} />
              </div>
            }
          />

          <Section
            title="Challenge Overview"
            description="Challenges are current goals. Completion is calculated from your recorded films."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-4">
              <OverviewStat label="Target" value={challenge.targetLabel} />
              <OverviewStat label="Category" value={challenge.category} />
              <OverviewStat label="Difficulty" value={challenge.difficulty} />
              <OverviewStat label="Lifecycle" value={progress.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {getManagementActions(progress.status).map((action) => (
                <button
                  key={action}
                  type="button"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white"
                >
                  {action}
                </button>
              ))}
            </div>
          </Section>

          <Section
            title="Progress"
            description="Progress is shown through evidence, not only a number."
            className="p-4 md:p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-3xl font-semibold text-white">
                  {progress.current} / {progress.target}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {progress.percentage}% recorded
                </p>
              </div>
              <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/45"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Progress Evidence"
            description="The films that currently count toward this Passport challenge."
            className="p-4 md:p-5"
          >
            <div className="space-y-6">
              <ChallengeEvidenceList
                title="Completed"
                marker="Done"
                movies={progress.completedEvidence}
                emptyText="No completed films are attached to this challenge yet."
              />
              <ChallengeEvidenceList
                title="Remaining"
                marker="Open"
                movies={progress.remainingEvidence}
                emptyText="No direct remaining movie is available in the sample data yet. Use the related Encyclopedia context below."
              />
            </div>
          </Section>

          <Section
            title="Suggested Next"
            description="The next step should help this challenge continue naturally."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {progress.suggestedNext.map((item) => (
                <AtlasCard key={`${item.label}-${item.href}`} href={item.href} className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {item.label}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-400">
                    {item.description}
                  </p>
                </AtlasCard>
              ))}
            </div>
          </Section>

          <Section
            title="Related Encyclopedia"
            description="Use connected knowledge to understand why this goal matters."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <AtlasCard href={primarySuggestion.href} className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {primarySuggestion.label}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {primarySuggestion.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Open the core context behind this challenge.
                </p>
              </AtlasCard>
              <AtlasCard href="/encyclopedia/movies" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Movies
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Browse Films
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Find another film that can move this goal forward.
                </p>
              </AtlasCard>
              <AtlasCard href="/explore/journeys" className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Journey
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  Guided Exploration
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Start in Explore, then let Passport remember the result.
                </p>
              </AtlasCard>
            </div>
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Move from this challenge into a directly related next step."
            items={[
              {
                label: primarySuggestion.label,
                title: primarySuggestion.title,
                description: primarySuggestion.description,
                href: primarySuggestion.href,
                level: "primary",
              },
              {
                label: "Explore",
                title: "Browse Journeys",
                description:
                  "Journeys guide exploration. Passport records what follows.",
                href: "/explore/journeys",
                level: "deep",
              },
              {
                label: "Passport",
                title: "Return to Passport",
                description: "Review challenges, achievements, and journey progress.",
                href: "/passport",
              },
            ]}
          />

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

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function getManagementActions(status: ChallengeProgress["status"]) {
  if (status === "completed") return ["Pin", "Archive"];
  if (status === "paused") return ["Pin", "Resume", "Archive"];
  if (status === "archived") return ["Resume", "Pin"];
  if (status === "pinned") return ["Pause", "Archive"];
  return ["Pin", "Pause", "Archive"];
}

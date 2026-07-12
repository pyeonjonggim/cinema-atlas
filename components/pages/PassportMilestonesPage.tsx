import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import MilestoneCard from "@/components/passport/MilestoneCard";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import EmptyState from "@/components/ui/EmptyState";
import type { MilestoneProgress } from "@/lib/passport";

type PassportMilestonesPageProps = {
  milestones: MilestoneProgress[];
};

export default function PassportMilestonesPage({
  milestones,
}: PassportMilestonesPageProps) {
  const inProgress = milestones.filter((item) => !item.completed);
  const completed = milestones.filter((item) => item.completed);
  const categories = Array.from(
    new Set(milestones.map((item) => item.milestone.category))
  );

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow="Passport Milestones"
            title="Milestones"
            description="Long-term growth markers that show how your cinema exploration is accumulating over time."
          />

          <Section
            title="In Progress"
            description="Milestones are growth markers, not rewards."
            className="p-4 md:p-5"
          >
            {inProgress.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {inProgress.map((progress) => (
                  <MilestoneCard key={progress.milestone.id} progress={progress} />
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No milestone in progress."
                description="Future growth markers will appear here."
              />
            )}
          </Section>

          <Section
            title="Completed Milestones"
            description="Completed milestones preserve the points where your exploration crossed a threshold."
            className="p-4 md:p-5"
          >
            {completed.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {completed.map((progress) => (
                  <MilestoneCard key={progress.milestone.id} progress={progress} />
                ))}
              </div>
            ) : (
              <EmptyState
                preset="passport"
                title="No completed milestone yet."
                description="Keep exploring and your first milestone will become part of your Passport."
              />
            )}
          </Section>

          <Section
            title="Milestone Categories"
            description="The dimensions currently tracked by Passport."
            className="p-4 md:p-5"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-neutral-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Milestones should point back toward the next meaningful path."
            items={[
              {
                label: "Passport",
                title: "Return to Passport",
                description: "Review challenges, achievements, and history.",
                href: "/passport",
                level: "primary",
              },
              {
                label: "History",
                title: "Open Passport History",
                description: "See when your Passport changed over time.",
                href: "/passport/history",
              },
              {
                label: "Explore",
                title: "Browse Journeys",
                description: "Start another guided exploration.",
                href: "/explore/journeys",
                level: "deep",
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  );
}

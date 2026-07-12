import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import PassportHistoryTimeline from "@/components/passport/PassportHistoryTimeline";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import type { PassportHistoryEvent } from "@/types/passport";

type PassportHistoryPageProps = {
  events: PassportHistoryEvent[];
};

export default function PassportHistoryPage({
  events,
}: PassportHistoryPageProps) {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          <UniversalHero
            eyebrow="Passport History"
            title="Exploration Timeline"
            description="A timeline of Challenge, Achievement, Milestone, and Journey events. This is not a copy of My Activity."
          />

          <Section
            title="Recent Activity"
            description="Passport History focuses on exploration system events, not every watched movie."
            className="p-4 md:p-5"
          >
            <PassportHistoryTimeline events={events} />
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="History should always point back toward another meaningful path."
            items={[
              {
                label: "Passport",
                title: "Return to Passport",
                description: "Review your active exploration system.",
                href: "/passport",
                level: "primary",
              },
              {
                label: "Milestones",
                title: "Open Milestones",
                description: "See long-term growth markers.",
                href: "/passport/milestones",
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

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import JourneyLibrary from "@/components/journey/JourneyLibrary";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import { officialJourneys } from "@/data/journeys";

export default function JourneyLibraryPage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <UniversalHero
            eyebrow="Official Journeys"
            title="Journey Library"
            description="Guided exploration paths curated by Cinema Atlas. Journeys teach sequence, context, and connection."
          />

          <Section
            eyebrow="Cinema Atlas Curated"
            title="Official Journeys"
            description="Search and filter guided learning routes. Community Journey is visible as a future source, but not implemented yet."
            className="p-4 md:p-5"
          >
            <JourneyLibrary journeys={officialJourneys} />
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Journey Library should always lead back into exploration."
            items={[
              {
                label: "Explore Home",
                title: "Return to Explore",
                description: "Choose another way into cinema.",
                href: "/explore",
                level: "primary",
              },
              {
                label: "Knowledge Hub",
                title: "Open Encyclopedia",
                description: "Deepen the context behind each Journey step.",
                href: "/encyclopedia",
                level: "secondary",
              },
              {
                label: "Exploration System",
                title: "Open Passport",
                description: "Connect learning paths to future challenges later.",
                href: "/passport",
                level: "deep",
              },
            ]}
          />
        </div>
      </PageContainer>
    </>
  );
}

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import JourneyLibrary from "@/components/journey/JourneyLibrary";
import SavedJourneyShelf from "@/components/journey/SavedJourneyShelf";
import GeneratedJourneyCandidateCard from "@/components/journey/GeneratedJourneyCandidateCard";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import {
  listGeneratedJourneyCandidates,
  listPublishedJourneys,
} from "@/lib/journeyQuery";

export default async function JourneyLibraryPage() {
  const journeys = await listPublishedJourneys();
  const generatedCandidates = await listGeneratedJourneyCandidates();

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
            eyebrow="Saved"
            title="Saved Journeys"
            description="Return to the paths you chose to keep. Saved Journeys are local for now and will move into Passport persistence later."
            className="p-4 md:p-5"
          >
            <SavedJourneyShelf journeys={journeys} />
          </Section>

          <Section
            eyebrow="Cinema Atlas Curated"
            title="Official Journeys"
            description="Search and filter guided learning routes. Community Journey is visible as a future source, but not implemented yet."
            className="p-4 md:p-5"
          >
            <JourneyLibrary journeys={journeys} />
          </Section>

          {generatedCandidates.length > 0 && (
            <Section
              eyebrow="Editorial Preview"
              title="Generated Journey Candidates"
              description="These routes were generated from Journey Blueprints and are waiting for editorial promotion. They are visible here as production candidates, not public canon."
              className="p-4 md:p-5"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {generatedCandidates.map((journey) => (
                  <GeneratedJourneyCandidateCard
                    key={journey.id}
                    journey={journey}
                  />
                ))}
              </div>
            </Section>
          )}

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

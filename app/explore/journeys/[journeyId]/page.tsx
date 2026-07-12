import Link from "next/link";
import { notFound } from "next/navigation";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import RelatedJourneySection from "@/components/journey/RelatedJourneySection";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import AtlasCard from "@/components/ui/AtlasCard";
import { journeys } from "@/data/journeys";
import {
  getJourneySteps,
  getRelatedJourneys,
  resolveJourneyStep,
} from "@/lib/journeys";

type JourneyDetailPageProps = {
  params: Promise<{
    journeyId: string;
  }>;
};

export default async function JourneyDetailPage({
  params,
}: JourneyDetailPageProps) {
  const { journeyId } = await params;
  const journey = journeys.find((item) => item.id === journeyId);

  if (!journey) {
    notFound();
  }

  const steps = getJourneySteps(journey).map(resolveJourneyStep);
  const relatedJourneys = getRelatedJourneys(journey, 3);

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <Link
            href="/explore/journeys"
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            Back to Journey Library
          </Link>

          <UniversalHero
            eyebrow={journey.official ? "Official Journey" : "Community Journey"}
            title={journey.title}
            description={journey.subtitle}
            stats={`${formatDifficulty(journey.difficulty)} / ${journey.estimatedMovies} films / ${journey.estimatedHours}h`}
          />

          <Section
            eyebrow="Journey Overview"
            title="Why this route matters"
            description="A Journey should give you enough context to begin, then move you toward the next meaningful stop."
            className="p-4 md:p-5"
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
              <div>
                <p className="text-sm leading-7 text-neutral-300">
                  {journey.description}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <JourneyFact label="Author" value={journey.author} />
                  <JourneyFact label="Category" value={formatCategory(journey.category)} />
                  <JourneyFact label="Stops" value={String(steps.length)} />
                  <JourneyFact label="Type" value={journey.official ? "Official" : "Community"} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  What You Will Explore
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journey.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section
            eyebrow="Your Route"
            title="Move one stop at a time"
            description="Each stop has one purpose, one context sentence, and one destination."
            className="p-4 md:p-5"
          >
            <JourneyTimeline steps={steps} />
          </Section>

          <RelatedJourneySection journeys={relatedJourneys} />

          <Section
            eyebrow="Continue Exploring"
            title="Choose the next layer"
            description="Compact exits for moving beyond this Journey."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <AtlasCard href="/explore/journeys" className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Journeys
                </p>
                <h3 className="mt-2 font-semibold text-white">
                  Explore More Journeys
                </h3>
              </AtlasCard>
              <AtlasCard href="/encyclopedia" className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Knowledge
                </p>
                <h3 className="mt-2 font-semibold text-white">
                  Browse Encyclopedia
                </h3>
              </AtlasCard>
              <AtlasCard href="/passport" className="rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Passport
                </p>
                <h3 className="mt-2 font-semibold text-white">View Passport</h3>
              </AtlasCard>
            </div>
          </Section>
        </div>
      </PageContainer>
    </>
  );
}

function JourneyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDifficulty(difficulty: string) {
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

function formatCategory(category: string) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

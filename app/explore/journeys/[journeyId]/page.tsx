import Link from "next/link";
import { notFound } from "next/navigation";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import RelatedJourneySection from "@/components/journey/RelatedJourneySection";
import JourneyStopCard from "@/components/journey/JourneyStopCard";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
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
  const relatedJourneys = getRelatedJourneys(journey, 4);

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
            eyebrow="About This Journey"
            title="Why take this Journey?"
            description={journey.description}
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-4">
              <JourneyFact label="Author" value={journey.author} />
              <JourneyFact label="Category" value={formatCategory(journey.category)} />
              <JourneyFact label="Steps" value={String(steps.length)} />
              <JourneyFact label="Type" value={journey.official ? "Official" : "Community"} />
            </div>
          </Section>

          <Section
            eyebrow="What You Will Explore"
            title="The core ideas"
            description="A Journey should give you a few strong handles before it asks you to move."
            className="p-4 md:p-5"
          >
            <div className="flex flex-wrap gap-2">
              {journey.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-neutral-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Explore Route"
            title="Follow the path in order"
            description="The route is the current interface. The domain remains open for future graph-based Journey structures."
            className="p-4 md:p-5"
          >
            <JourneyTimeline steps={steps} />
          </Section>

          <Section
            eyebrow="Journey Stops"
            title="Open one stop at a time"
            description="Each stop shows only what it is, why it matters, and where it leads."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {steps.map((step) => (
                <JourneyStopCard key={step.id} step={step} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Related Encyclopedia"
            title="Every step opens existing knowledge"
            description="Journey does not duplicate Encyclopedia information. It creates an order for exploring it."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {steps.slice(0, 4).map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20 hover:bg-white/[0.065]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    {step.entityType}
                  </p>
                  <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-neutral-400">
                    Open Encyclopedia
                  </p>
                </Link>
              ))}
            </div>
          </Section>

          <RelatedJourneySection journeys={relatedJourneys} />

          <EntityContinueJourneyPattern
            title="Continue Exploring"
            description="Use these as service-wide exploration paths, separate from related Journey recommendations."
            items={[
              {
                label: "Journey Library",
                title: "Browse More Journeys",
                description: "Choose another guided learning path.",
                href: "/explore/journeys",
                level: "primary" as const,
              },
              {
                label: "Explore Home",
                title: "Return to Explore",
                description: "Start from another discovery entry.",
                href: "/explore",
                level: "secondary" as const,
              },
              {
                label: "Knowledge Hub",
                title: "Open Encyclopedia",
                description: "Deepen the context behind any Journey stop.",
                href: "/encyclopedia",
                level: "secondary" as const,
              },
              {
                label: "Exploration System",
                title: "Open Passport",
                description: "Connect exploration to long-term goals later.",
                href: "/passport",
                level: "deep" as const,
              },
            ].filter(Boolean)}
          />
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

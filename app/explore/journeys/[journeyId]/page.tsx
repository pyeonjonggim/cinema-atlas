import Link from "next/link";
import { notFound } from "next/navigation";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import RelatedJourneySection from "@/components/journey/RelatedJourneySection";
import SaveJourneyButton from "@/components/journey/SaveJourneyButton";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import {
  getPublishedJourneyById,
  getRelatedPublishedJourneys,
  getResolvedJourneySteps,
} from "@/lib/journeyQuery";
import {
  getJourneyDifficultyLabel,
  scoreJourneyDifficulty,
} from "@/lib/journeyDifficulty";

type JourneyDetailPageProps = {
  params: Promise<{
    journeyId: string;
  }>;
};

export default async function JourneyDetailPage({
  params,
}: JourneyDetailPageProps) {
  const { journeyId } = await params;
  const journey = await getPublishedJourneyById(journeyId);

  if (!journey) {
    notFound();
  }

  const steps = await getResolvedJourneySteps(journey);
  const relatedJourneys = await getRelatedPublishedJourneys(journey, 3);
  const difficultyScore = scoreJourneyDifficulty(journey);
  const firstStep = steps[0];
  const filmSteps = steps.filter((step) => step.entityType === "movie");
  const contextSteps = steps.filter((step) => step.entityType !== "movie");

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <Link
            href="/explore"
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            Back to Explore
          </Link>

          <UniversalHero
            eyebrow={journey.official ? "Official Journey" : "Community Journey"}
            title={journey.title}
            description={journey.description}
            visualTone={getHeroTone(journey.category)}
            minHeight="compact"
            stats={`${getJourneyDifficultyLabel(difficultyScore.computedDifficulty)} / Difficulty ${difficultyScore.score} / ${journey.estimatedMovies} ${journey.estimatedMovies === 1 ? "film" : "films"} / ${journey.estimatedHours}h`}
            actions={
              <SaveJourneyButton journeyId={journey.id} title={journey.title} />
            }
          />

          <Section
            eyebrow="Viewing Plan"
            title="What to pay attention to"
            description="This page is a guide. It tells you why each stop exists and what you should notice before moving on."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Curator&apos;s Note
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Start with context, then watch the film differently.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-300">
                  {journey.subtitle} The route is ordered so each stop prepares
                  the next one: context first, then the work, then the people or
                  institutions that make the work easier to understand.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <JourneyFact label="First Stop" value={firstStep?.title ?? "Start"} />
                <JourneyFact label="Context Stops" value={String(contextSteps.length)} />
                <JourneyFact label="Films to Watch" value={String(filmSteps.length)} />
                <JourneyFact
                  label="Difficulty"
                  value={`${getJourneyDifficultyLabel(difficultyScore.computedDifficulty)} ${difficultyScore.score}`}
                />
                <JourneyFact label="Estimated Time" value={`${journey.estimatedHours}h`} />
              </div>
            </div>
          </Section>

          <Section
            eyebrow="Route Order"
            title="Follow these stops in sequence"
            description="Open each stop when you need context. Film stops are the works to watch; the other stops explain what to look for."
            className="p-4 md:p-5"
          >
            <JourneyTimeline steps={steps} />
          </Section>

          <RelatedJourneySection journeys={relatedJourneys} />

          <Section
            eyebrow="After This Journey"
            title="Keep the next step simple"
            description="When the route ends, choose one continuation rather than opening the whole catalog at once."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/explore"
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/25 hover:bg-white/[0.055]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Explore
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Choose another journey
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Return to the journey-first Explore page and begin from a
                  different question.
                </p>
                <p className="mt-5 text-sm font-semibold text-neutral-300 transition group-hover:text-white">
                  Back to Explore
                </p>
              </Link>

              <Link
                href="/passport"
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/25 hover:bg-white/[0.055]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Passport
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Save the path for later
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Passport is where guided exploration can become a longer
                  personal record.
                </p>
                <p className="mt-5 text-sm font-semibold text-neutral-300 transition group-hover:text-white">
                  Open Passport
                </p>
              </Link>
            </div>
          </Section>
        </div>
      </PageContainer>
    </>
  );
}

function JourneyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function getHeroTone(category: string) {
  if (category === "country") return "place";
  if (category === "director") return "portrait";
  if (category === "movement") return "archive";
  if (category === "award") return "cinematic";
  return "explorer";
}

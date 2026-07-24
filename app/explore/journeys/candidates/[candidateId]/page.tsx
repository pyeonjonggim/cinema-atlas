import Link from "next/link";
import { notFound } from "next/navigation";

import JourneyTimeline from "@/components/journey/JourneyTimeline";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import {
  getGeneratedJourneyCandidateById,
  getResolvedJourneySteps,
} from "@/lib/journeyQuery";
import {
  getJourneyDifficultyLabel,
  scoreJourneyDifficulty,
} from "@/lib/journeyDifficulty";
import type { JourneyProjection } from "@/types/journey";

type JourneyCandidatePreviewPageProps = {
  params: Promise<{
    candidateId: string;
  }>;
};

export default async function JourneyCandidatePreviewPage({
  params,
}: JourneyCandidatePreviewPageProps) {
  const { candidateId } = await params;
  const candidate = await getGeneratedJourneyCandidateById(candidateId);

  if (!candidate) {
    notFound();
  }

  const steps = await getResolvedJourneySteps(candidate);
  const difficulty = scoreJourneyDifficulty(candidate, candidate.steps);
  const movieSteps = candidate.steps.filter((step) => step.entityType === "movie");
  const contextSteps = candidate.steps.filter((step) => step.entityType !== "movie");
  const readiness = getReadinessCopy(candidate);

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
            eyebrow="Editorial Preview"
            title={candidate.title}
            description={candidate.description}
            visualTone="archive"
            minHeight="compact"
            stats={`${formatStatus(candidate.catalogStatus)} / ${getJourneyDifficultyLabel(difficulty.computedDifficulty)} ${difficulty.score} / ${movieSteps.length} films / ${candidate.steps.length} stops`}
          />

          <Section
            eyebrow="Review State"
            title="This generated route is not public yet"
            description="Candidate previews let Cinema Atlas inspect generated Journey structure before anything enters the official catalog."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Editorial Note
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Review the sequence before promoting the Journey.
                </h2>
                <p className="mt-4 text-sm leading-7 text-neutral-300">
                  {readiness}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CandidateFact
                  label="Candidate Status"
                  value={formatStatus(candidate.catalogStatus)}
                />
                <CandidateFact label="Total Stops" value={String(candidate.steps.length)} />
                <CandidateFact label="Film Stops" value={String(movieSteps.length)} />
                <CandidateFact label="Context Stops" value={String(contextSteps.length)} />
                <CandidateFact
                  label="Difficulty"
                  value={`${getJourneyDifficultyLabel(difficulty.computedDifficulty)} ${difficulty.score}`}
                />
                <CandidateFact label="Estimated Time" value={`${candidate.estimatedHours}h`} />
              </div>
            </div>
          </Section>

          <Section
            eyebrow="Candidate Route"
            title="Inspect the proposed sequence"
            description="Film stops should carry most of the route, while context stops should make the next film easier to understand."
            className="p-4 md:p-5"
          >
            <JourneyTimeline steps={steps} />
          </Section>

          <Section
            eyebrow="Promotion Guardrails"
            title="Publication requires editorial approval"
            description="Generated Journeys can be useful drafts, but Cinema Atlas treats publication as an editorial decision."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-3">
              <GuardrailCard
                title="No automatic publishing"
                description="This route remains unlisted until the editorial layer explicitly promotes it."
              />
              <GuardrailCard
                title="Film-forward structure"
                description="A public Journey should be led by films, not only reference entities or categories."
              />
              <GuardrailCard
                title="Smooth transitions"
                description="Each stop should prepare the viewer for the next one, not feel like a loose catalog list."
              />
            </div>
          </Section>
        </div>
      </PageContainer>
    </>
  );
}

function CandidateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function GuardrailCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>
    </div>
  );
}

function getReadinessCopy(candidate: JourneyProjection) {
  if (candidate.catalogStatus === "review") {
    return "This candidate has passed the first generation checks and is ready for editorial inspection. It still cannot appear as a public Journey until it is promoted.";
  }

  if (candidate.catalogStatus === "draft") {
    return "This candidate is still a draft. It should be strengthened before review, usually by adding more film stops and clearer transitions between context and viewing.";
  }

  return "This candidate is available for inspection, but it should not be treated as part of the public Journey catalog.";
}

function formatStatus(status: JourneyProjection["catalogStatus"]) {
  if (status === "review") return "In Review";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return "Published";
}

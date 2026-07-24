import Link from "next/link";

import type { JourneyProjection } from "@/types/journey";
import {
  getJourneyDifficultyLabel,
  scoreJourneyDifficulty,
} from "@/lib/journeyDifficulty";

type GeneratedJourneyCandidateCardProps = {
  journey: JourneyProjection;
};

export default function GeneratedJourneyCandidateCard({
  journey,
}: GeneratedJourneyCandidateCardProps) {
  const difficulty = scoreJourneyDifficulty(journey, journey.steps);
  const movieSteps = journey.steps.filter((step) => step.entityType === "movie");
  const contextSteps = journey.steps.filter((step) => step.entityType !== "movie");

  return (
    <article className="rounded-3xl border border-dashed border-white/12 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Generated Candidate
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {journey.title}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
          {formatStatus(journey.catalogStatus)}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-400">
        {journey.description}
      </p>

      <div className="mt-5 grid gap-2 text-sm text-neutral-400 sm:grid-cols-4">
        <CandidateFact label="Steps" value={String(journey.steps.length)} />
        <CandidateFact label="Films" value={String(movieSteps.length)} />
        <CandidateFact label="Context" value={String(contextSteps.length)} />
        <CandidateFact
          label="Difficulty"
          value={`${getJourneyDifficultyLabel(difficulty.computedDifficulty)} ${difficulty.score}`}
        />
      </div>

      <div className="mt-5 space-y-2">
        {journey.steps.slice(0, 5).map((step, index) => (
          <div
            key={step.id}
            className="grid grid-cols-[1.6rem_1fr] gap-3 text-sm"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-neutral-500">
              {index + 1}
            </span>
            <p className="line-clamp-1 text-neutral-400">
              <span className="text-neutral-500">{formatStepType(step.entityType)}</span>{" "}
              {step.learningGoal}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-xs leading-5 text-neutral-600">
          This candidate is visible for editorial review only. It is not part of
          the public Journey catalog until promoted.
        </p>
        <Link
          href={`/explore/journeys/candidates/${journey.id}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-white/30 hover:text-white"
        >
          Preview Candidate
        </Link>
      </div>
    </article>
  );
}

function CandidateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
        {label}
      </p>
      <p className="mt-2 font-semibold text-neutral-300">{value}</p>
    </div>
  );
}

function formatStatus(status: JourneyProjection["catalogStatus"]) {
  if (status === "review") return "In Review";
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return "Published";
}

function formatStepType(entityType: JourneyProjection["steps"][number]["entityType"]) {
  if (entityType === "movie") return "Film";
  return entityType[0].toUpperCase() + entityType.slice(1);
}

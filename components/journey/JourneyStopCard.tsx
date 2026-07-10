import Link from "next/link";

import type { ResolvedJourneyStep } from "@/lib/journeys";

type JourneyStopCardProps = {
  step: ResolvedJourneyStep;
};

export default function JourneyStopCard({ step }: JourneyStopCardProps) {
  return (
    <Link
      href={step.href}
      className="group block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.055]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {formatStepType(step.entityType)}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
          Step {step.order}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-400">
        {step.learningGoal}
      </p>

      <p className="mt-4 text-sm font-medium text-neutral-300 transition group-hover:text-white">
        Open Stop
      </p>
    </Link>
  );
}

function formatStepType(type: ResolvedJourneyStep["entityType"]) {
  const labels = {
    movie: "Movie",
    director: "Director",
    actor: "Actor",
    country: "Country",
    movement: "Movement",
    award: "Award",
  };

  return labels[type];
}

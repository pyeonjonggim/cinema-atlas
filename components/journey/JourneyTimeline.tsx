import Link from "next/link";

import type { ResolvedJourneyStep } from "@/lib/journeys";

type JourneyTimelineProps = {
  steps: ResolvedJourneyStep[];
};

export default function JourneyTimeline({ steps }: JourneyTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Link
          key={step.id}
          href={step.href}
          className="group block rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.055]"
        >
          <div className="grid gap-5 lg:grid-cols-[4rem_minmax(0,0.9fr)_minmax(0,1.2fr)_auto] lg:items-center">
            <p className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/25 text-sm font-semibold text-neutral-300">
              {String(index + 1).padStart(2, "0")}
            </p>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {formatStepType(step.entityType)}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white group-hover:underline">
                {step.title}
              </h3>

              {step.subtitle && (
                <p className="mt-1 text-sm text-neutral-500">{step.subtitle}</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Why this stop
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {step.learningGoal}
              </p>
            </div>

            <span className="text-sm font-semibold text-neutral-300 transition group-hover:text-white">
              {step.entityType === "movie" ? "View Film" : "Open Stop"}
            </span>
          </div>

          {step.note && (
            <p className="mt-4 border-l border-white/10 pl-4 text-xs leading-5 text-neutral-500">
              {step.note}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

function formatStepType(type: ResolvedJourneyStep["entityType"]) {
  const labels = {
    movie: "Film",
    director: "Director",
    actor: "Actor",
    country: "Country",
    movement: "Movement",
    award: "Award",
  };

  return labels[type];
}

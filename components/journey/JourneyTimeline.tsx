import Link from "next/link";

import type { ResolvedJourneyStep } from "@/lib/journeys";

type JourneyTimelineProps = {
  steps: ResolvedJourneyStep[];
};

export default function JourneyTimeline({ steps }: JourneyTimelineProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <Link
          key={step.id}
          href={step.href}
          className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <div className="grid gap-4 md:grid-cols-[8rem_minmax(0,1fr)_minmax(18rem,1.2fr)_auto] md:items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {String(index + 1).padStart(2, "0")} · {formatStepType(step.entityType)}
            </p>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white group-hover:underline">
                {step.title}
              </h3>

              {step.subtitle && (
                <p className="mt-1 text-sm text-neutral-500">{step.subtitle}</p>
              )}
            </div>

            <p className="text-sm leading-6 text-neutral-400">
              {step.learningGoal}
            </p>

            <span className="text-sm font-medium text-neutral-300 transition group-hover:text-white">
              {step.entityType === "movie" ? "View Film" : "Open Stop"}
            </span>
          </div>

          {step.note && (
            <p className="mt-3 text-xs text-neutral-500">{step.note}</p>
          )}
        </Link>
      ))}
    </div>
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

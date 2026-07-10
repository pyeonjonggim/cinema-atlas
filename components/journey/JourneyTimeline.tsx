import Link from "next/link";

import type { ResolvedJourneyStep } from "@/lib/journeys";

type JourneyTimelineProps = {
  steps: ResolvedJourneyStep[];
};

export default function JourneyTimeline({ steps }: JourneyTimelineProps) {
  return (
    <div className="relative space-y-3 border-l border-white/10 pl-6">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          <div className="absolute -left-[31px] top-4 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-neutral-950 text-[10px] text-neutral-400">
            {index + 1}
          </div>

          <Link
            href={step.href}
            className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(18rem,1.35fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Stop {step.order}
                </p>

                <h3 className="mt-2 text-xl font-semibold text-white group-hover:underline">
                  {step.title}
                </h3>

                {step.subtitle && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {step.subtitle}
                  </p>
                )}
              </div>

              <p className="text-sm leading-6 text-neutral-400">
                {step.learningGoal}
              </p>

              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-400">
                {formatStepType(step.entityType)}
              </span>
            </div>

            {step.note && (
              <p className="mt-3 text-xs text-neutral-500">{step.note}</p>
            )}
          </Link>
        </div>
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

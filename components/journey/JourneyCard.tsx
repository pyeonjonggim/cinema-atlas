import Link from "next/link";

import type { Journey, JourneyStep } from "@/types/journey";
import {
  getJourneyDifficultyLabel,
  scoreJourneyDifficulty,
} from "@/lib/journeyDifficulty";

type JourneyCardProps = {
  journey: Journey;
  steps: JourneyStep[];
  variant?: "standard" | "featured";
};

export default function JourneyCard({
  journey,
  steps,
  variant = "standard",
}: JourneyCardProps) {
  const orderedSteps = [...steps].sort((a, b) => a.order - b.order);
  const isFeatured = variant === "featured";
  const difficultyScore = scoreJourneyDifficulty(journey, orderedSteps);

  return (
    <Link
      href={`/explore/journeys/${journey.id}`}
      className={`group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_22px_70px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.055] ${
        isFeatured ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${isFeatured ? "min-h-[24rem]" : "h-48"}`}
      >
        <div className={`absolute inset-0 ${getJourneyTone(journey.category)}`} />
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(0,0,0,0.2),rgba(0,0,0,0.74)_62%,rgba(0,0,0,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Official Journey
            </p>
            <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-neutral-300">
              {orderedSteps.length} steps
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-neutral-400">
              {formatCategory(journey.category)}
            </p>
            <h3
              className={`mt-2 font-semibold leading-tight tracking-tight text-white ${
                isFeatured ? "text-4xl md:text-6xl" : "text-2xl"
              }`}
            >
              {journey.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex min-h-full flex-col p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {getJourneyDifficultyLabel(difficultyScore.computedDifficulty)}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            Difficulty {difficultyScore.score}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {journey.estimatedMovies} films
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {journey.estimatedHours}h
          </span>
        </div>

        <p
          className={`mt-5 text-sm leading-6 text-neutral-300 ${
            isFeatured ? "line-clamp-3" : "line-clamp-2"
          }`}
        >
          {journey.description}
        </p>

        {orderedSteps.length > 0 && (
          <div className="mt-6 space-y-2">
            {orderedSteps.slice(0, isFeatured ? 5 : 3).map((step, index) => (
              <div
                key={step.id}
                className="grid grid-cols-[1.7rem_1fr] gap-3 text-sm"
              >
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-[11px] font-semibold text-neutral-500">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    {formatStepType(step.entityType)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-neutral-300">
                    {step.learningGoal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {journey.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/[0.045] px-3 py-1 text-xs text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="text-xs text-neutral-500">
            {journey.official ? "Cinema Atlas Curated" : "Community"}
          </span>
          <span className="text-sm font-semibold text-neutral-300 transition group-hover:text-white">
            Start Journey
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatStepType(entityType: JourneyStep["entityType"]) {
  if (entityType === "movie") return "Film Step";
  return `${entityType[0].toUpperCase()}${entityType.slice(1)} Step`;
}

function formatCategory(category: Journey["category"]) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getJourneyTone(category: Journey["category"]) {
  const tones = {
    country:
      "bg-[radial-gradient(circle_at_28%_26%,rgba(119,161,143,0.32),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.16),transparent_26%),linear-gradient(135deg,rgba(15,31,27,0.92),rgba(9,8,7,0.98))]",
    movement:
      "bg-[radial-gradient(circle_at_30%_24%,rgba(105,122,160,0.34),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(135deg,rgba(19,22,32,0.92),rgba(9,8,7,0.98))]",
    director:
      "bg-[radial-gradient(circle_at_30%_24%,rgba(150,136,105,0.34),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(135deg,rgba(29,25,20,0.92),rgba(9,8,7,0.98))]",
    award:
      "bg-[radial-gradient(circle_at_30%_24%,rgba(168,143,74,0.3),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.16),transparent_25%),linear-gradient(135deg,rgba(31,27,16,0.92),rgba(9,8,7,0.98))]",
    theme:
      "bg-[radial-gradient(circle_at_30%_24%,rgba(145,105,128,0.3),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(135deg,rgba(29,20,27,0.92),rgba(9,8,7,0.98))]",
    "film-history":
      "bg-[radial-gradient(circle_at_30%_24%,rgba(143,136,124,0.28),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.14),transparent_25%),linear-gradient(135deg,rgba(24,23,20,0.92),rgba(9,8,7,0.98))]",
  };

  return tones[category];
}

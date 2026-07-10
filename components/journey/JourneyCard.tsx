import Link from "next/link";

import type { Journey } from "@/types/journey";

type JourneyCardProps = {
  journey: Journey;
};

export default function JourneyCard({ journey }: JourneyCardProps) {
  return (
    <Link
      href={`/explore/journeys/${journey.id}`}
      className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="relative h-36 bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <p className="absolute bottom-4 left-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          Official Journey
        </p>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {formatCategory(journey.category)}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {formatDifficulty(journey.difficulty)}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {journey.estimatedMovies} films
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {journey.estimatedHours}h
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-white">
          {journey.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
          {journey.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-500">
            {journey.official ? "Cinema Atlas Curated" : "Community"}
          </span>
          <span className="text-sm font-medium text-neutral-300 transition group-hover:text-white">
            Start Journey
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDifficulty(difficulty: Journey["difficulty"]) {
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

function formatCategory(category: Journey["category"]) {
  return category
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

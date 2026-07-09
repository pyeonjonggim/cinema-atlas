import type { ChallengeProgress } from "@/lib/passport";

type ChallengeCardProps = {
  progress: ChallengeProgress;
  compact?: boolean;
};

export default function ChallengeCard({
  progress,
  compact = false,
}: ChallengeCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {progress.challenge.category}
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            {progress.challenge.title}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400">
          {progress.challenge.difficulty}
        </span>
      </div>

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {progress.challenge.description}
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">{progress.challenge.targetLabel}</span>
          <span className="text-neutral-300">
            {progress.current} / {progress.target}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/40"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {progress.percentage}% explored
        </p>
      </div>
    </div>
  );
}

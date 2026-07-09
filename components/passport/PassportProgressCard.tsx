import type { EntityProgress } from "@/lib/passport";

type PassportProgressCardProps = {
  progress: EntityProgress;
};

export default function PassportProgressCard({
  progress,
}: PassportProgressCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {progress.category}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {progress.label}
          </h3>
        </div>
        <span className="text-sm text-neutral-400">{progress.rank}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400">
            {progress.current} / {progress.target}
          </span>
          <span className="text-neutral-300">{progress.percentage}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/40"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {progress.traces.length > 0 ? (
          progress.traces.map((trace) => (
            <span
              key={trace}
              className="rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400"
            >
              {trace}
            </span>
          ))
        ) : (
          <span className="text-sm text-neutral-500">Ready to explore.</span>
        )}
      </div>
    </div>
  );
}

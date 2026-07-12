import AtlasCard from "@/components/ui/AtlasCard";
import type { MilestoneProgress } from "@/lib/passport";

type MilestoneCardProps = {
  progress: MilestoneProgress;
};

export default function MilestoneCard({ progress }: MilestoneCardProps) {
  return (
    <AtlasCard className="rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {progress.completed ? "Completed" : progress.unavailable ? "Unavailable" : "In Progress"}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {progress.milestone.title}
          </h3>
        </div>
        {progress.completedAt && (
          <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400">
            {progress.completedAt}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-6 text-neutral-400">
        {progress.milestone.description}
      </p>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
        <span>{progress.milestone.unit}</span>
        <span>
          {progress.current} / {progress.target}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/40"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </AtlasCard>
  );
}

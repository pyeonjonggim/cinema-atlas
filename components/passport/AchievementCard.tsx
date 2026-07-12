import type { AchievementProgress } from "@/lib/passport";
import AtlasCard from "@/components/ui/AtlasCard";

type AchievementCardProps = {
  achievement: AchievementProgress;
  compact?: boolean;
};

export default function AchievementCard({
  achievement,
  compact = false,
}: AchievementCardProps) {
  const { unlocked, unlockedAt } = achievement;

  return (
    <AtlasCard
      href={`/passport/achievements/${achievement.achievement.id}`}
      className={`rounded-2xl bg-black/20 p-4 ${
        unlocked ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Achievement
          </p>
          <h3 className="mt-2 text-base font-semibold text-white">
            {achievement.achievement.title}
          </h3>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-neutral-400">
          {unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {achievement.achievement.description}
        </p>
      )}

      {unlockedAt && (
        <p className="mt-3 text-xs text-neutral-500">Unlocked {unlockedAt}</p>
      )}

      {!unlocked && achievement.missingRequirements[0] && (
        <p className="mt-3 text-xs text-neutral-500">
          Need: {achievement.missingRequirements[0]}
        </p>
      )}

      <p className="mt-4 text-sm font-medium text-neutral-300">
        View Achievement
      </p>
    </AtlasCard>
  );
}

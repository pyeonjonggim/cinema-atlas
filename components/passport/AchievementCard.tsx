import AtlasCard from "../ui/AtlasCard";

type AchievementCardProps = {
  title: string;
  description: string;
  progress?: string;
  unlocked?: boolean;
};

export default function AchievementCard({
  title,
  description,
  progress,
  unlocked = false,
}: AchievementCardProps) {
  return (
    <AtlasCard className={unlocked ? "" : "opacity-70"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Achievement
          </p>

          <h3 className="mt-3 text-2xl font-bold text-white">
            {title}
          </h3>
        </div>

        <span className="text-2xl">
          {unlocked ? "🏆" : "🔒"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-400">
        {description}
      </p>

      {progress && (
        <p className="mt-5 text-sm font-medium text-neutral-300">
          {progress}
        </p>
      )}
    </AtlasCard>
  );
}
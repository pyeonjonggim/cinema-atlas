import AtlasCard from "../ui/AtlasCard";

type BadgeCardProps = {
  title: string;
  description: string;
  unlocked?: boolean;
};

export default function BadgeCard({
  title,
  description,
  unlocked = false,
}: BadgeCardProps) {
  return (
    <AtlasCard className={unlocked ? "" : "opacity-60"}>
      <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
        {unlocked ? "Unlocked" : "Locked"}
      </p>

      <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>

      <p className="mt-4 text-sm leading-6 text-neutral-400">
        {description}
      </p>
    </AtlasCard>
  );
}
type AchievementRequirementListProps = {
  requirements: string[];
};

export default function AchievementRequirementList({
  requirements,
}: AchievementRequirementListProps) {
  if (requirements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {requirements.map((requirement) => (
        <div
          key={requirement}
          className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-400"
        >
          {requirement}
        </div>
      ))}
    </div>
  );
}

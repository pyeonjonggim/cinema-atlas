import type { InsightCount } from "@/lib/insights";

type DistributionListProps = {
  items: InsightCount[];
  limit?: number;
};

export default function DistributionList({
  items,
  limit = 6,
}: DistributionListProps) {
  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
        Not enough record yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleItems.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-white">{item.label}</span>
            <span className="text-neutral-500">
              {item.value}
              {typeof item.percentage === "number" ? ` / ${item.percentage}%` : ""}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/35"
              style={{ width: `${item.percentage ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

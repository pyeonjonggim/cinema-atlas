import type { CollectionStats } from "@/lib/collections";

type CollectionStatisticsProps = {
  stats: CollectionStats;
};

export default function CollectionStatistics({ stats }: CollectionStatisticsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Movies" value={`${stats.movieCount}`} />
      <StatCard label="Countries" value={`${stats.countryCount}`} />
      <StatCard label="Directors" value={`${stats.directorCount}`} />
      <StatCard
        label="Average Rating"
        value={
          typeof stats.averageRating === "number"
            ? stats.averageRating.toFixed(2)
            : "Not rated"
        }
      />
      <StatCard label="Journals" value={`${stats.journalCount}`} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

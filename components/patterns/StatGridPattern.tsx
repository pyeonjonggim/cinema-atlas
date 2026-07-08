type StatItem = {
  label: string;
  value: string | number;
};

type StatGridPatternProps = {
  title?: string;
  stats: StatItem[];
};

export default function StatGridPattern({
  title,
  stats,
}: StatGridPatternProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      {title && (
        <h2 className="mb-6 text-2xl font-bold text-white">
          {title}
        </h2>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-black/20 p-5"
          >
            <p className="text-sm text-neutral-500">
              {stat.label}
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
type PassportProgressProps = {
  current: number;
  total: number;
  label?: string;
};

export default function PassportProgress({
  current,
  total,
  label = "Passport Progress",
}: PassportProgressProps) {
  const percentage =
    total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          {label}
        </p>

        <span className="text-sm text-neutral-400">
          {current} / {total}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-3 text-sm text-neutral-500">
        {percentage}% Complete
      </p>
    </section>
  );
}
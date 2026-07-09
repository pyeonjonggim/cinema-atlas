type InsightCardProps = {
  label: string;
  value: string;
  note?: string;
};

export default function InsightCard({ label, value, note }: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {note && <p className="mt-2 text-sm leading-5 text-neutral-400">{note}</p>}
    </div>
  );
}

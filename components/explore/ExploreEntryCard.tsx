import Link from "next/link";

type ExploreEntryCardProps = {
  href: string;
  label: string;
  title: string;
  description: string;
  meta?: string;
  tone?: "default" | "country" | "director" | "movement" | "award";
};

export default function ExploreEntryCard({
  href,
  label,
  title,
  description,
  meta,
  tone = "default",
}: ExploreEntryCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className={`h-28 ${getToneClass(tone)}`} />

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {label}
        </p>

        <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-400">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          {meta && <span className="text-xs text-neutral-500">{meta}</span>}
          <span className="text-sm font-medium text-neutral-300 transition group-hover:text-white">
            Explore
          </span>
        </div>
      </div>
    </Link>
  );
}

function getToneClass(tone: ExploreEntryCardProps["tone"]) {
  const resolvedTone = tone ?? "default";
  const classes = {
    default:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
    country:
      "bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(135deg,rgba(92,132,116,0.3),rgba(255,255,255,0.02))]",
    director:
      "bg-[radial-gradient(circle_at_52%_32%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,rgba(120,111,93,0.32),rgba(255,255,255,0.02))]",
    movement:
      "bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,rgba(92,104,132,0.32),rgba(255,255,255,0.02))]",
    award:
      "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.2),transparent_26%),linear-gradient(135deg,rgba(142,126,73,0.28),rgba(255,255,255,0.02))]",
  };

  return classes[resolvedTone];
}

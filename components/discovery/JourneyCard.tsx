import Link from "next/link";

type JourneyCardProps = {
  href: string;
  category: string;
  title: string;
  subtitle: string;
  difficulty: string;
  stops: number;
  movieCount?: number;
  viewingTime?: string;
};

export default function JourneyCard({
  href,
  category,
  title,
  subtitle,
  difficulty,
  stops,
  movieCount,
  viewingTime,
}: JourneyCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {category}
      </p>

      <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-neutral-400">{subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
          {difficulty}
        </span>

        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
          {stops} stops
        </span>

        {movieCount !== undefined && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {movieCount} {movieCount === 1 ? "film" : "films"}
          </span>
        )}

        {viewingTime && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-400">
            {viewingTime}
          </span>
        )}
      </div>

      <p className="mt-6 text-sm font-semibold text-neutral-300">
        Open Journey
      </p>
    </Link>
  );
}

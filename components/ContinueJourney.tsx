import Link from "next/link";

export type JourneyLinkItem = {
  label: string;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
};

type ContinueJourneyProps = {
  title?: string;
  subtitle?: string;
  items: JourneyLinkItem[];
};

export default function ContinueJourney({
  title = "Continue Journey",
  subtitle = "Where should your next cinema journey go?",
  items,
}: ContinueJourneyProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) =>
          item.disabled ? (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-black/10 p-4 opacity-50"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {item.label}
              </p>
              <p className="mt-2 font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            </div>
          ) : (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {item.label}
              </p>
              <p className="mt-2 font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            </Link>
          )
        )}
      </div>
    </section>
  );
}
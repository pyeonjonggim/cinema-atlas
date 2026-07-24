import Link from "next/link";

import Section from "../layout/Section";

export type EntityContinueJourneyItem = {
  label: string;
  title: string;
  description?: string;
  href: string;
  level?: "primary" | "secondary" | "deep";
  disabled?: boolean;
};

type EntityContinueJourneyPatternProps = {
  title?: string;
  description?: string;
  items: EntityContinueJourneyItem[];
  mode?: "grid" | "curated";
};

export default function EntityContinueJourneyPattern({
  title = "Continue Journey",
  description = "Choose the next meaningful path from this entity.",
  items,
  mode = "grid",
}: EntityContinueJourneyPatternProps) {
  const activeItems = items.filter((item) => !item.disabled);
  const primaryItem = activeItems[0];
  const secondaryItems = activeItems.slice(1, 4);

  if (mode === "curated") {
    if (!primaryItem) {
      return (
        <Section title={title} description={description} className="p-4 md:p-5">
          <p className="text-sm text-neutral-500">
            No connected journey is available yet.
          </p>
        </Section>
      );
    }

    return (
      <Section title={title} description={description} className="p-4 md:p-5">
        <div className="space-y-4">
          <Link
            href={primaryItem.href}
            className="group block rounded-2xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {getLevelLabel(primaryItem.level)}
                </p>

                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {primaryItem.title}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  {primaryItem.label}
                </p>

                {primaryItem.description && (
                  <div className="mt-4 border-l border-white/15 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Curator&apos;s Note
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-300">
                      {primaryItem.description}
                    </p>
                  </div>
                )}
              </div>

              <span className="inline-flex shrink-0 text-sm font-medium text-neutral-300 transition group-hover:text-white">
                Continue Exploring
              </span>
            </div>
          </Link>

          {secondaryItems.length > 0 && (
            <details className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-300 transition hover:text-white">
                More paths
              </summary>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {secondaryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      {getLevelLabel(item.level)}
                    </p>
                    <h4 className="mt-2 line-clamp-1 text-sm font-semibold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {item.description ?? item.label}
                    </p>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section title={title} description={description} className="p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {activeItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {getLevelLabel(item.level)}
            </p>

            <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">
              {item.title}
            </h3>

            <p className="mt-1 text-sm text-neutral-500">{item.label}</p>

            {item.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            )}

            <p className="mt-5 text-sm font-medium text-neutral-300 transition group-hover:text-white">
              Continue Exploring
            </p>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function getLevelLabel(level: EntityContinueJourneyItem["level"]) {
  if (level === "primary") return "Recommended Path";
  if (level === "deep") return "Journey";
  return "Next Step";
}

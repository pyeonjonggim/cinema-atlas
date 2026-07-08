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
};

export default function EntityContinueJourneyPattern({
  title = "Continue Journey",
  description = "Choose the next meaningful path from this entity.",
  items,
}: EntityContinueJourneyPatternProps) {
  const activeItems = items.filter((item) => !item.disabled);

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

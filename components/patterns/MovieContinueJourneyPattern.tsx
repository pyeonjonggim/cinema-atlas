import Link from "next/link";

import Section from "../layout/Section";
import type { EntityNavigationItem } from "../navigation/EntityNavigation";

type MovieContinueJourneyPatternProps = {
  items: EntityNavigationItem[];
};

export default function MovieContinueJourneyPattern({
  items,
}: MovieContinueJourneyPatternProps) {
  return (
    <Section
      title="Continue Journey"
      description="Choose the next meaningful path from this film."
      className="p-4 md:p-5"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              {getLevelLabel(item.level)}
            </p>

            <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">
              {item.label}
            </h3>

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

function getLevelLabel(level: EntityNavigationItem["level"]) {
  if (level === "primary") return "Recommended Path";
  if (level === "deep") return "Journey";
  return "Next Step";
}

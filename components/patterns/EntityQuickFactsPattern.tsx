import type { ReactNode } from "react";

import Section from "../layout/Section";

export type EntityQuickFact = {
  label: string;
  value: ReactNode;
};

type EntityQuickFactsPatternProps = {
  facts: EntityQuickFact[];
  description?: string;
  action?: ReactNode;
};

export default function EntityQuickFactsPattern({
  facts,
  description = "Essential context before continuing the journey.",
  action,
}: EntityQuickFactsPatternProps) {
  return (
    <Section
      title="Quick Facts"
      description={description}
      className="p-4 md:p-5"
      action={action}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              {fact.label}
            </p>
            <div className="mt-1 line-clamp-1 text-sm font-medium text-white">
              {fact.value}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

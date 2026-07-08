import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>

        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
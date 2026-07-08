import type { ReactNode } from "react";

type ListHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  totalLabel: string;
  action?: ReactNode;
};

export default function ListHero({
  eyebrow,
  title,
  description,
  searchPlaceholder,
  totalLabel,
  action,
}: ListHeroProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-6 md:px-10 md:py-7">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
          {title}
        </h1>

        <p className="mt-2 text-lg leading-7 text-neutral-300">
          {description}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full max-w-xl items-center rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-neutral-500">
            <span>{searchPlaceholder}</span>

            <span className="ml-auto text-neutral-600">
              ⌕
            </span>
          </div>

          <div className="shrink-0 text-sm font-medium text-neutral-400">
            {totalLabel}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
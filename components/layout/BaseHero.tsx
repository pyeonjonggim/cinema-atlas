import type { ReactNode } from "react";

type BaseHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  children?: ReactNode;
};

export default function BaseHero({
  eyebrow,
  title,
  subtitle,
  description,
  meta,
  children,
}: BaseHeroProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
      {eyebrow && (
        <p className="text-sm uppercase tracking-[0.25em] text-neutral-500">
          {eyebrow}
        </p>
      )}

      <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">
        {title}
      </h1>

      {subtitle && <p className="mt-3 text-lg text-neutral-300">{subtitle}</p>}

      {description && (
        <p className="mt-5 max-w-3xl leading-7 text-neutral-400">
          {description}
        </p>
      )}

      {meta && <div className="mt-6 flex flex-wrap gap-2">{meta}</div>}

      {children && <div className="mt-7">{children}</div>}
    </section>
  );
}
import type { ReactNode } from "react";

type UniversalHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  search?: ReactNode;
  stats?: ReactNode;
  backgroundImage?: string;
};

export default function UniversalHero({
  eyebrow,
  title,
  description,
  search,
  stats,
  backgroundImage,
}: UniversalHeroProps) {
  const hasUtilityRow = search || stats;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.34)] md:min-h-[19rem] md:p-12">
      {backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.72)_42%,rgba(0,0,0,0.2)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent_24%,rgba(255,255,255,0.035)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="pointer-events-none absolute right-8 top-8 hidden h-[calc(100%-4rem)] w-[34%] lg:block">
        <div className="grid h-full grid-cols-3 gap-3 opacity-70">
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.055]" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.075]" />
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.045]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/10 to-neutral-950/80" />
      </div>

      <div className="relative z-10 flex min-h-48 max-w-3xl flex-col justify-center">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-4 text-5xl font-semibold leading-tight text-white md:text-6xl">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300 md:text-base">
            {description}
          </p>
        )}

        {hasUtilityRow && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {search && <div className="w-full max-w-xl">{search}</div>}
            {stats && (
              <div className="shrink-0 text-sm font-medium text-neutral-400">
                {stats}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

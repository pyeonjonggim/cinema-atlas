import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function Section({
  title,
  subtitle,
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}
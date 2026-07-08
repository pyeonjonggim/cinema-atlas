import type { ReactNode } from "react";
import SectionHeader from "./SectionHeader";

type SectionProps = {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export default function Section({
  children,
  className = "",
  eyebrow,
  title,
  description,
  action,
}: SectionProps) {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 ${className}`}
    >
      {title && (
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
        />
      )}

      {children}
    </section>
  );
}
import Link from "next/link";
import type { ReactNode } from "react";

type AtlasCardProps = {
  children: ReactNode;
  href?: string;
  className?: string;
};

export default function AtlasCard({
  children,
  href,
  className = "",
}: AtlasCardProps) {
  const cardClassName = `rounded-[var(--atlas-radius-card)] border border-[var(--atlas-border)] bg-[var(--atlas-surface)] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--atlas-border-strong)] hover:bg-[var(--atlas-surface-strong)] hover:shadow-xl hover:shadow-black/20 ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${cardClassName} block cursor-pointer`}>
        {children}
      </Link>
    );
  }

  return <div className={cardClassName}>{children}</div>;
}

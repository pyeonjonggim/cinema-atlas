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
  const cardClassName = `rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06] ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${cardClassName} block cursor-pointer`}>
        {children}
      </Link>
    );
  }

  return <div className={cardClassName}>{children}</div>;
}
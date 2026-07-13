import Link from "next/link";
import type { ReactNode } from "react";

type AtlasButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
};

export default function AtlasButton({
  children,
  href,
  onClick,
  variant = "primary",
  disabled = false,
}: AtlasButtonProps) {
  const baseClass =
    "inline-flex items-center justify-center rounded-[var(--atlas-radius-control)] px-6 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--atlas-accent)]";

  const variantClass = {
    primary:
      "border border-white/15 bg-[var(--atlas-accent)] text-[var(--atlas-text-on-image)] shadow-[0_16px_42px_rgba(31,122,104,0.22)] hover:-translate-y-0.5 hover:bg-[var(--atlas-accent-hover)] hover:shadow-[0_20px_52px_rgba(31,122,104,0.28)]",
    secondary:
      "border border-[var(--atlas-border)] bg-white/[0.035] text-[var(--atlas-text-muted)] hover:-translate-y-0.5 hover:bg-[var(--atlas-surface-strong)] hover:text-[var(--atlas-text)]",
    ghost: "text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]",
  };

  const disabledClass = disabled
    ? "pointer-events-none opacity-50"
    : "cursor-pointer";

  const className = `${baseClass} ${variantClass[variant]} ${disabledClass}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

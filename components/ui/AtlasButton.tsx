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
    "inline-flex items-center justify-center rounded-[var(--atlas-radius-control)] px-5 py-2 text-sm font-semibold transition duration-200";

  const variantClass = {
    primary:
      "border border-[var(--atlas-border)] bg-[var(--atlas-accent)] text-[var(--atlas-text-on-image)] hover:bg-[var(--atlas-accent-hover)]",
    secondary:
      "border border-[var(--atlas-border)] text-[var(--atlas-text-muted)] hover:bg-[var(--atlas-surface-strong)] hover:text-[var(--atlas-text)]",
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

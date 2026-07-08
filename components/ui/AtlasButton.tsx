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
    "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition";

  const variantClass = {
    primary: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
    secondary:
      "border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white",
    ghost: "text-neutral-400 hover:text-white",
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
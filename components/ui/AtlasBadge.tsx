type AtlasBadgeProps = {
  label: string;
  variant?: "default" | "success" | "warning";
};

export default function AtlasBadge({
  label,
  variant = "default",
}: AtlasBadgeProps) {
  const variantClass = {
    default:
      "border-white/10 bg-white/[0.04] text-neutral-300",
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    warning:
      "border-amber-500/20 bg-amber-500/10 text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${variantClass[variant]}`}
    >
      {label}
    </span>
  );
}
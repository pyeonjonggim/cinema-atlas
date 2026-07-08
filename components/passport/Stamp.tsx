type StampProps = {
  label: string;
  active?: boolean;
};

export default function Stamp({ label, active = false }: StampProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-white/[0.03] text-neutral-500"
      }`}
    >
      {label}
    </span>
  );
}
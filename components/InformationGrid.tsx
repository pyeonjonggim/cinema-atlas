import type { ReactNode } from "react";

export type InformationGridItem = {
  label: string;
  value: ReactNode;
};

type InformationGridProps = {
  items: InformationGridItem[];
  className?: string;
};

export default function InformationGrid({
  items,
  className = "",
}: InformationGridProps) {
  return (
    <dl className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-black/20 p-4">
          <dt className="text-sm text-neutral-500">{item.label}</dt>
          <dd className="mt-1 text-white">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
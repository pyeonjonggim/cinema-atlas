import Link from "next/link";

export type MajorMovementItem = {
  slug: string;
  name: string;
  description?: string;
};

type MajorMovementsProps = {
  items: MajorMovementItem[];
  maxItems?: number;
};

export default function MajorMovements({
  items,
  maxItems = 5,
}: MajorMovementsProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Major Movements
      </h2>

      {visibleItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleItems.map((movement) => (
            <Link
              key={movement.slug}
              href={`/encyclopedia/movements/${movement.slug}`}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              {movement.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400">Major movements are not added yet.</p>
      )}
    </section>
  );
}
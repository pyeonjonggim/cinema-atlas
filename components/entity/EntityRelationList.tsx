import Link from "next/link";

export type EntityRelationItem = {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

type EntityRelationListProps = {
  title: string;
  items: EntityRelationItem[];
  emptyMessage?: string;
};

export default function EntityRelationList({
  title,
  items,
  emptyMessage = "No related items yet.",
}: EntityRelationListProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>

      {items.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.href} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 transition hover:text-white"
              >
                <div>
                  <p className="font-medium text-neutral-200">{item.title}</p>

                  {item.subtitle && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {item.meta && (
                  <span className="shrink-0 text-sm text-neutral-500">
                    {item.meta}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-400">{emptyMessage}</p>
      )}
    </section>
  );
}
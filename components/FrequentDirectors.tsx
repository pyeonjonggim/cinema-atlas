import Link from "next/link";

export type FrequentDirectorItem = {
  slug: string;
  name: string;
  nameKo: string;
  count: number;
};

type FrequentDirectorsProps = {
  items: FrequentDirectorItem[];
  maxItems?: number;
};

export default function FrequentDirectors({
  items,
  maxItems = 5,
}: FrequentDirectorsProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Frequent Directors
      </h2>

      {visibleItems.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {visibleItems.map((director) => (
            <li key={director.slug} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/encyclopedia/directors/${director.slug}`}
                className="flex items-center justify-between gap-4 text-sm transition hover:text-white"
              >
                <span>
                  <span className="font-medium text-neutral-200">
                    {director.name}
                  </span>
                  <span className="ml-2 text-neutral-500">
                    {director.nameKo}
                  </span>
                </span>

                <span className="shrink-0 text-neutral-500">
                  {director.count} {director.count === 1 ? "film" : "films"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-400">
          Frequent directors are not available yet.
        </p>
      )}
    </section>
  );
}
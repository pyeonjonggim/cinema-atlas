import Link from "next/link";

export type RepresentativeDirectorItem = {
  slug: string;
  name: string;
  nameKo: string;
  description: string;
};

type RepresentativeDirectorsProps = {
  items: RepresentativeDirectorItem[];
  maxItems?: number;
};

export default function RepresentativeDirectors({
  items,
  maxItems = 5,
}: RepresentativeDirectorsProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Representative Directors
      </h2>

      {visibleItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleItems.map((director) => (
            <Link
              key={director.slug}
              href={`/encyclopedia/directors/${director.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/10"
            >
              <p className="font-semibold text-white">{director.name}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {director.nameKo}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-400">
                {director.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400">
          Representative directors are not added yet.
        </p>
      )}
    </section>
  );
}
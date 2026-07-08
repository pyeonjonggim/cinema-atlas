import Link from "next/link";

export type CollaboratorItem = {
  name: string;
  slug: string;
  count: number;
};

type FrequentCollaboratorsProps = {
  items: CollaboratorItem[];
  maxItems?: number;
};

export default function FrequentCollaborators({
  items,
  maxItems = 5,
}: FrequentCollaboratorsProps) {
  const visibleItems = items.slice(0, maxItems);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">
        Frequent Collaborators
      </h2>

      {visibleItems.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {visibleItems.map((actor) => (
            <li key={actor.slug} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/encyclopedia/actors/${actor.slug}`}
                className="flex items-center justify-between gap-4 text-sm transition hover:text-white"
              >
                <span className="font-medium text-neutral-200">
                  {actor.name}
                </span>

                <span className="shrink-0 text-neutral-500">
                  {actor.count} {actor.count === 1 ? "film" : "films"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-400">
          Frequent collaborators are not available yet.
        </p>
      )}
    </section>
  );
}
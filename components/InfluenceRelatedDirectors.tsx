import Link from "next/link";
import Section from "@/components/Section";
import type { Director } from "@/types/director";

type InfluenceRelatedDirectorsProps = {
  director: Director;
  directors: Director[];
};

function getDirectorsBySlugs(
  slugs: string[] | undefined,
  directors: Director[]
): Director[] {
  if (!slugs || slugs.length === 0) return [];

  return slugs
    .map((slug) => directors.find((item) => item.slug === slug))
    .filter((item): item is Director => Boolean(item));
}

function DirectorLinkList({
  title,
  items,
}: {
  title: string;
  items: Director[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </h3>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/encyclopedia/directors/${item.slug}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            {item.name}
            {item.nameKo ? (
              <span className="ml-1 text-zinc-500">{item.nameKo}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function InfluenceRelatedDirectors({
  director,
  directors,
}: InfluenceRelatedDirectorsProps) {
  const influencedBy = getDirectorsBySlugs(
    director.influencedByDirectorSlugs,
    directors
  );

  const influenced = getDirectorsBySlugs(
    director.influencedDirectorSlugs,
    directors
  );

  const related = getDirectorsBySlugs(
    director.relatedDirectorSlugs,
    directors
  );

  const hasAnyConnection =
    influencedBy.length > 0 || influenced.length > 0 || related.length > 0;

  if (!hasAnyConnection) return null;

  return (
    <Section title="Influence & Related Directors">
      <p className="mb-4 text-sm leading-6 text-zinc-400">
        Explore how this director connects to other filmmakers across influence,
        style, period, and cinematic context.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <DirectorLinkList title="Influenced By" items={influencedBy} />
        <DirectorLinkList title="Influenced" items={influenced} />
        <DirectorLinkList title="Related Directors" items={related} />
      </div>
    </Section>
  );
}

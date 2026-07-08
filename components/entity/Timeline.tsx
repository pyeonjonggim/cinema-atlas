import Link from "next/link";

export type TimelineItem = {
  id: string;
  year: number | string;
  title: string;
  subtitle?: string;
  description?: string;
  href?: string;
};

type TimelineProps = {
  title: string;
  items: TimelineItem[];
  emptyMessage?: string;
};

export default function Timeline({
  title,
  items,
  emptyMessage = "No timeline items yet.",
}: TimelineProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">{title}</h2>

      {items.length > 0 ? (
        <div className="relative space-y-5 border-l border-white/10 pl-6">
          {items.map((item) => {
            const content = (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10">
                <p className="text-sm font-semibold text-neutral-500">
                  {item.year}
                </p>

                <h3 className="mt-2 font-semibold text-white">
                  {item.title}
                </h3>

                {item.subtitle && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {item.subtitle}
                  </p>
                )}

                {item.description && (
                  <p className="mt-3 text-sm leading-6 text-neutral-400">
                    {item.description}
                  </p>
                )}
              </div>
            );

            return (
              <div key={item.id} className="relative">
                <div className="absolute -left-[31px] top-3 h-3 w-3 rounded-full border border-white/20 bg-neutral-950" />

                {item.href ? (
                  <Link href={item.href} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-neutral-400">{emptyMessage}</p>
      )}
    </section>
  );
}
import Link from "next/link";

export type EntityNavigationItem = {
  label: string;
  href: string;
  description?: string;
  level?: "primary" | "secondary" | "deep";
};

type EntityNavigationProps = {
  title?: string;
  items: EntityNavigationItem[];
};

export default function EntityNavigation({
  title = "Continue Exploring",
  items,
}: EntityNavigationProps) {
  const levelClass = {
    primary: "border-white/20 bg-white/[0.06] text-white",
    secondary: "border-white/10 bg-white/[0.03] text-neutral-300",
    deep: "border-white/10 bg-black/20 text-neutral-400",
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl border p-4 transition hover:border-white/20 hover:bg-white/[0.08] ${
              levelClass[item.level ?? "secondary"]
            }`}
          >
            <p className="font-semibold">{item.label}</p>

            {item.description && (
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {item.description}
              </p>
            )}

            <p className="mt-4 text-sm font-medium text-neutral-300">
              Explore →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
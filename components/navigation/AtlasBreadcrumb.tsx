import Link from "next/link";

export type AtlasBreadcrumbItem = {
  label: string;
  href?: string;
};

type AtlasBreadcrumbProps = {
  items: AtlasBreadcrumbItem[];
};

export default function AtlasBreadcrumb({ items }: AtlasBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-sm text-neutral-500 transition hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-sm ${
                  isLast ? "text-neutral-300" : "text-neutral-500"
                }`}
              >
                {item.label}
              </span>
            )}

            {!isLast && <span className="text-neutral-700">/</span>}
          </div>
        );
      })}
    </nav>
  );
}
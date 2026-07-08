import Link from "next/link";
import type { ReactNode } from "react";

type EncyclopediaCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  description: string;
  meta?: ReactNode;
  tags?: string[];
  footer?: ReactNode;
};

export default function EncyclopediaCard({
  href,
  title,
  subtitle,
  description,
  meta,
  tags = [],
  footer,
}: EncyclopediaCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.06]"
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white transition group-hover:text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
          )}
        </div>

        {meta && (
          <div className="text-sm text-neutral-400">
            {meta}
          </div>
        )}

        <p className="line-clamp-3 text-sm leading-6 text-neutral-300">
          {description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          {footer ? (
            <span className="text-sm text-neutral-400">
              {footer}
            </span>
          ) : (
            <span />
          )}

          <span className="text-sm font-medium text-neutral-200 transition group-hover:translate-x-1">
            Open Encyclopedia →
          </span>
        </div>
      </div>
    </Link>
  );
}
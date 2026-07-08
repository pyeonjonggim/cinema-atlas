import Link from "next/link";

type PageNavigationProps = {
  backHref?: string;
  backLabel?: string;
  nextHref?: string;
  nextLabel?: string;
};

export default function PageNavigation({
  backHref,
  backLabel = "Back",
  nextHref,
  nextLabel = "Next",
}: PageNavigationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="text-sm text-neutral-500 transition hover:text-white"
          >
            ← {backLabel}
          </Link>
        )}
      </div>

      <div>
        {nextHref && (
          <Link
            href={nextHref}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            {nextLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
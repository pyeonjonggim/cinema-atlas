import Link from "next/link";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Encyclopedia", href: "/encyclopedia" },
  { label: "My Atlas", href: "/my-atlas" },
  { label: "Passport", href: "/passport" },
];

export default function GlobalNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center px-10">
        <Link
          href="/"
          className="text-2xl font-black tracking-[0.18em] text-white"
        >
          CINEMA ATLAS
        </Link>

        <nav className="ml-10 hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-neutral-400 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex w-80 items-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-2">
            <span className="mr-3 text-neutral-500">⌕</span>

            <span className="text-sm text-neutral-500">
              Search movies, directors, countries...
            </span>
          </div>

          <button className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/10" />
        </div>
      </div>
    </header>
  );
}
import Link from "next/link";
import SearchTrigger from "@/components/search/SearchTrigger";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Encyclopedia", href: "/encyclopedia" },
  { label: "Passport", href: "/passport" },
  { label: "My Atlas", href: "/my" },
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
          <SearchTrigger />

          <button
            type="button"
            aria-label="Open account menu"
            className="h-9 w-9 rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/10"
          />
        </div>
      </div>
    </header>
  );
}

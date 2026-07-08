import Link from "next/link";

export type BottomNavigationItem = {
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
};

type BottomNavigationProps = {
  items?: BottomNavigationItem[];
};

const defaultItems: BottomNavigationItem[] = [
  {
    label: "Home",
    href: "/",
    icon: "⌂",
  },
  {
    label: "Explore",
    href: "/explore",
    icon: "🧭",
  },
  {
    label: "Encyclopedia",
    href: "/passport",
    icon: "◎",
  },
  {
    label: "Journal",
    href: "/journal",
    icon: "✎",
  },
  {
    label: "Passport",
    href: "/passport",
    icon: "◈",
  },
];

export default function BottomNavigation({
  items = defaultItems,
}: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-white/10 bg-neutral-950/90 px-3 py-2 shadow-2xl backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
              item.active
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            {item.icon && <span className="text-base">{item.icon}</span>}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
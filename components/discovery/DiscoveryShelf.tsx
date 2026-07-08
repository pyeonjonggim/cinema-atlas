import type { ReactNode } from "react";
import SectionHeader from "../layout/SectionHeader";

type DiscoveryShelfProps<T> = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;

  children?: ReactNode;

  items?: T[];
  renderItem?: (item: T) => ReactNode;

  columns?: "two" | "three" | "four";
};

export default function DiscoveryShelf<T>({
  eyebrow,
  title,
  description,
  action,
  children,
  items,
  renderItem,
  columns = "three",
}: DiscoveryShelfProps<T>) {
  const columnClass = {
    two: "md:grid-cols-2",
    three: "md:grid-cols-2 xl:grid-cols-3",
    four: "md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <section>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />

      <div className={`grid gap-5 ${columnClass[columns]}`}>
        {items && renderItem
          ? items.map((item) => renderItem(item))
          : children}
      </div>
    </section>
  );
}
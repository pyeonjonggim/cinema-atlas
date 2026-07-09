import type { ReactNode } from "react";

type InsightGridProps = {
  children: ReactNode;
};

export default function InsightGrid({ children }: InsightGridProps) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

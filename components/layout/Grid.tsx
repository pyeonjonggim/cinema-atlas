import type { ReactNode } from "react";

type GridProps = {
  children: ReactNode;
  columns?: "two" | "three" | "four";
  className?: string;
};

export default function Grid({
  children,
  columns = "three",
  className = "",
}: GridProps) {
  const columnClass = {
    two: "md:grid-cols-2",
    three: "md:grid-cols-2 xl:grid-cols-3",
    four: "md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-5 ${columnClass[columns]} ${className}`}>
      {children}
    </div>
  );
}
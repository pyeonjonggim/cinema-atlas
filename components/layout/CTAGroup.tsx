import type { ReactNode } from "react";

type CTAGroupProps = {
  children: ReactNode;
  align?: "left" | "center" | "right";
};

export default function CTAGroup({
  children,
  align = "left",
}: CTAGroupProps) {
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div className={`mt-6 flex flex-wrap gap-3 ${alignClass[align]}`}>
      {children}
    </div>
  );
}
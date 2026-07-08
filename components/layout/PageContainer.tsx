import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  size?: "narrow" | "default" | "wide";
};

export default function PageContainer({
  children,
  size = "default",
}: PageContainerProps) {
  const width = {
    narrow: "max-w-5xl",
    default: "max-w-7xl",
    wide: "max-w-[90rem]",
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className={`mx-auto w-full ${width[size]}`}>
        {children}
      </div>
    </main>
  );
}
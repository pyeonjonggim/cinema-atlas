import type { ReactNode } from "react";
import DiscoveryShelf from "../discovery/DiscoveryShelf";

type RecommendedShelfPatternProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function RecommendedShelfPattern({
  eyebrow,
  title,
  description,
  action,
  children,
}: RecommendedShelfPatternProps) {
  return (
    <DiscoveryShelf
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={action}
    >
      {children}
    </DiscoveryShelf>
  );
}
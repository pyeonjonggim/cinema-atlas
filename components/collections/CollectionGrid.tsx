import EmptyState from "@/components/ui/EmptyState";
import type { CollectionView } from "@/lib/collections";

import CollectionCard from "./CollectionCard";

type CollectionGridProps = {
  views: CollectionView[];
  compact?: boolean;
};

export default function CollectionGrid({
  views,
  compact = false,
}: CollectionGridProps) {
  if (views.length === 0) {
    return (
      <EmptyState
        preset="collection"
        title="No collections yet."
        description="Collections will appear here as your cinema world grows."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {views.map((view) => (
        <CollectionCard key={view.collection.id} view={view} compact={compact} />
      ))}
    </div>
  );
}

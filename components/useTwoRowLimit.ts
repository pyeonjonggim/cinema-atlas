"use client";

import { useEffect, useMemo, useState } from "react";

function getTwoRowLimit() {
  if (typeof window === "undefined") return 16;
  if (window.matchMedia("(min-width: 1280px)").matches) return 16;
  if (window.matchMedia("(min-width: 1024px)").matches) return 14;
  if (window.matchMedia("(min-width: 768px)").matches) return 10;
  if (window.matchMedia("(min-width: 640px)").matches) return 6;
  return 4;
}

export function useTwoRowLimit<T>(items: T[], resetKey: string) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [limit, setLimit] = useState(getTwoRowLimit);
  const isExpanded = expandedKey === resetKey;

  useEffect(() => {
    const updateLimit = () => setLimit(getTwoRowLimit());
    const frame = window.requestAnimationFrame(updateLimit);
    window.addEventListener("resize", updateLimit);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateLimit);
    };
  }, []);

  const visibleItems = useMemo(
    () => (isExpanded ? items : items.slice(0, limit)),
    [isExpanded, items, limit],
  );

  return {
    visibleItems,
    isExpanded,
    canExpand: items.length > limit,
    remainingCount: Math.max(0, items.length - limit),
    showAll: () => setExpandedKey(resetKey),
    collapse: () => setExpandedKey(null),
  };
}

"use client";

import type { ReactNode } from "react";
import UniversalHero from "@/components/layout/UniversalHero";

export type ListHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  totalLabel: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  action?: ReactNode;
};

export default function ListHero({
  eyebrow,
  title,
  description,
  searchPlaceholder,
  totalLabel,
  searchValue = "",
  onSearchChange,
  action,
}: ListHeroProps) {
  const search = onSearchChange ? (
    <input
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder={searchPlaceholder}
      className="w-full rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/25"
    />
  ) : (
    <div className="flex w-full items-center rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm text-neutral-500">
      <span>{searchPlaceholder}</span>
    </div>
  );

  const stats = (
    <div className="flex flex-wrap items-center gap-3">
      <span>{totalLabel}</span>
      {action}
    </div>
  );

  return (
    <UniversalHero
      eyebrow={eyebrow}
      title={title}
      description={description}
      search={search}
      stats={stats}
    />
  );
}

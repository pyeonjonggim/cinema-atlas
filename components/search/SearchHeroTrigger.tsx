"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const SearchOverlay = dynamic(() => import("@/components/search/SearchOverlay"), {
  ssr: false,
  loading: () => null,
});

type SearchHeroTriggerProps = {
  label?: string;
};

export default function SearchHeroTrigger({ label = "Search Cinema Atlas..." }: SearchHeroTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Cinema Atlas"
        className="flex w-full items-center rounded-full border border-white/10 bg-black/35 px-5 py-3 text-left text-sm text-neutral-500 backdrop-blur transition hover:border-white/20 hover:text-neutral-300"
      >
        {label}
      </button>
      {open && <SearchOverlay open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

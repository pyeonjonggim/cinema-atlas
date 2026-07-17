"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const SearchOverlay = dynamic(() => import("@/components/search/SearchOverlay"), {
  ssr: false,
  loading: () => null,
});

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Cinema Atlas"
        className="hidden w-80 items-center justify-between rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.06] md:flex"
      >
        <span className="text-sm text-neutral-500">
          Search Cinema Atlas
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.68rem] font-semibold text-neutral-500">
          Ctrl K
        </span>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Cinema Atlas"
        className="flex h-9 items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white md:hidden"
      >
        Search
      </button>

      {open && <SearchOverlay open={open} onClose={close} />}
    </>
  );
}

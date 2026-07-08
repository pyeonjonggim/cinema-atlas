"use client";

import { useRef } from "react";

type JourneyItem = {
  title: string;
  category: string;
  progress: number;
};

type ContinueJourneyCarouselProps = {
  items: JourneyItem[];
};

export default function ContinueJourneyCarousel({
  items,
}: ContinueJourneyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({
      left: -380,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: 380,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white hover:bg-zinc-800"
      >
        ←
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-14 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.title} className="min-w-[320px] md:min-w-[360px]">
            <ProgressCard
              title={item.title}
              category={item.category}
              progress={item.progress}
            />
          </div>
        ))}
      </div>

      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-3 text-white hover:bg-zinc-800"
      >
        →
      </button>
    </div>
  );
}

type ProgressCardProps = {
  title: string;
  category: string;
  progress: number;
};

function ProgressCard({ title, category, progress }: ProgressCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">{category}</p>

      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        <span className="text-sm text-zinc-400">{progress}%</span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
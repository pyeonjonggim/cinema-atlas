"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import JournalCard from "@/components/journal/JournalCard";
import {
  buildJournalItems,
  formatJournalDate,
  formatJournalRating,
} from "@/components/journal/journalUtils";
import MyAtlasLayout from "@/components/layout/MyAtlasLayout";
import Section from "@/components/layout/Section";
import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";
import type { JournalEntry } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

type MyJournalDetailPageProps = {
  entry?: JournalEntry;
  entryId: string;
  movie?: Movie;
  userMovie?: UserMovie;
  journalEntries: JournalEntry[];
  movies: Movie[];
  userMovies: UserMovie[];
};

export default function MyJournalDetailPage({
  entry,
  entryId,
  movie,
  userMovie,
  journalEntries,
  movies,
  userMovies,
}: MyJournalDetailPageProps) {
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const [hasLoadedLocalEntries, setHasLoadedLocalEntries] = useState(Boolean(entry));
  const allJournalEntries = useMemo(
    () => mergeJournalEntries(journalEntries, localEntries),
    [journalEntries, localEntries]
  );
  const displayEntry =
    entry ?? allJournalEntries.find((journalEntry) => journalEntry.id === entryId);
  const displayMovie =
    movie ?? movies.find((item) => item.id === displayEntry?.movieId);
  const displayUserMovie =
    userMovie ??
    userMovies.find((item) => item.movieId === displayEntry?.movieId);
  const journalItems = buildJournalItems({
    journalEntries: allJournalEntries,
    movies,
    userMovies,
  });
  const currentIndex = journalItems.findIndex(
    (item) => item.entry.id === displayEntry?.id
  );
  const moreFromThisFilm = journalItems.filter(
    (item) =>
      item.entry.movieId === displayEntry?.movieId &&
      item.entry.id !== displayEntry?.id
  );
  const previousEntry = currentIndex > 0 ? journalItems[currentIndex - 1] : undefined;
  const nextEntry =
    currentIndex >= 0 && currentIndex < journalItems.length - 1
      ? journalItems[currentIndex + 1]
      : undefined;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocalEntries(readLocalJournalEntries());
      setHasLoadedLocalEntries(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!displayEntry) {
    return (
      <MyAtlasLayout>
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Journal
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {hasLoadedLocalEntries ? "Journal not found" : "Loading journal"}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {hasLoadedLocalEntries
              ? "This local journal may have been removed from the browser."
              : "Checking your temporary journal record in this browser."}
          </p>
        </section>
      </MyAtlasLayout>
    );
  }

  return (
    <MyAtlasLayout>
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center md:p-5">
        <Link
          href={displayMovie ? `/movies/${displayMovie.id}` : "/encyclopedia/movies"}
          className="group block h-24 w-16 flex-none md:h-[108px] md:w-[72px]"
        >
          <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
            {displayMovie?.poster ? (
              <Image
                src={displayMovie.poster}
                alt={displayMovie.title}
                fill
                sizes="72px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
            )}
          </div>
        </Link>

        <div className="min-w-0 self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Compact Journal Header
          </p>
          <h1 className="mt-2 line-clamp-1 text-2xl font-semibold text-white md:text-3xl">
            {displayMovie?.title ?? displayEntry.movieId}
          </h1>
          <div className="mt-3 grid gap-2 text-sm text-neutral-400 sm:grid-cols-2 lg:grid-cols-5">
            <HeaderFact
              label="Rating"
              value={formatJournalRating(displayUserMovie?.myRating)}
            />
            <HeaderFact
              label="Watched"
              value={displayUserMovie?.watchedDate ?? "Not recorded"}
            />
            <HeaderFact label="Journal" value={displayEntry.date} />
            <HeaderFact label="Visibility" value={displayEntry.visibility ?? "private"} />
            <HeaderFact label="Kind" value={formatJournalKind(displayEntry.kind)} />
          </div>
        </div>
      </section>

      <Section title="My Journal" className="p-5 md:p-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>{formatJournalDate(displayEntry.date)}</span>
            {displayEntry.mood && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-neutral-300">
                {displayEntry.mood}
              </span>
            )}
            {displayEntry.containsSpoilers && (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                Spoiler
              </span>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            {displayEntry.title ?? "Untitled journal"}
          </h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-neutral-300">
            {displayEntry.body}
          </p>
        </div>
      </Section>

      {moreFromThisFilm.length > 0 && (
        <Section
          title="More From This Film"
          description="Other notes connected to the same movie."
          className="p-4 md:p-5"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {moreFromThisFilm.slice(0, 3).map((item) => (
              <JournalCard key={item.entry.id} item={item} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Adjacent Entries" className="p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2">
          {previousEntry ? (
            <AdjacentEntryCard label="Previous Journal" href={`/my/journal/${previousEntry.entry.id}`} title={previousEntry.entry.title ?? "Untitled journal"} />
          ) : (
            <AdjacentEntryCard label="Previous Journal" title="No newer entry" />
          )}
          {nextEntry ? (
            <AdjacentEntryCard label="Next Journal" href={`/my/journal/${nextEntry.entry.id}`} title={nextEntry.entry.title ?? "Untitled journal"} />
          ) : (
            <AdjacentEntryCard label="Next Journal" title="No older entry" />
          )}
        </div>
      </Section>

      <Section title="Related Movie" className="p-4 md:p-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Movie
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {displayMovie?.title ?? displayEntry.movieId}
            </h2>
          </div>
          <AtlasButton
            href={displayMovie ? `/movies/${displayMovie.id}` : "/encyclopedia/movies"}
            variant="secondary"
          >
            View Movie Detail
          </AtlasButton>
        </div>
      </Section>

      <Section title="Continue Exploring" className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SmallJourneyCard href="/my/journal" label="Journal" title="Back to Journal" />
          <SmallJourneyCard href="/my/activity" label="Activity" title="Review Activity" />
          <SmallJourneyCard href="/explore" label="Explore" title="Find Another Path" />
        </div>
      </Section>
    </MyAtlasLayout>
  );
}

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 line-clamp-1 text-sm text-neutral-300">{value}</p>
    </div>
  );
}

function AdjacentEntryCard({
  label,
  href,
  title,
}: {
  label: string;
  href?: string;
  title: string;
}) {
  const content = (
    <AtlasCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <h3 className="mt-2 line-clamp-1 text-base font-semibold text-white">
        {title}
      </h3>
    </AtlasCard>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function SmallJourneyCard({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <AtlasCard href={href} className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
    </AtlasCard>
  );
}

function formatJournalKind(kind?: JournalEntry["kind"]) {
  if (kind === "study-note") return "Study Note";

  return "Diary";
}

function readLocalJournalEntries(): JournalEntry[] {
  try {
    const rawEntries = window.localStorage.getItem("cinema-atlas:journalEntries");
    if (!rawEntries) return [];

    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function mergeJournalEntries(
  baseEntries: JournalEntry[],
  localEntries: JournalEntry[]
) {
  const entryMap = new Map<string, JournalEntry>();

  [...localEntries, ...baseEntries].forEach((entry) => {
    entryMap.set(entry.id, entry);
  });

  return Array.from(entryMap.values());
}

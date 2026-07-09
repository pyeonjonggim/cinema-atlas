"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import AtlasButton from "@/components/ui/AtlasButton";
import type { JournalEntry, JournalKind, JournalMood, JournalVisibility } from "@/types/journal";
import type { Movie } from "@/types/movie";
import type { UserMovie } from "@/types/userMovie";

const localJournalStorageKey = "cinema-atlas:journalEntries";

const moodOptions: JournalMood[] = [
  "inspired",
  "moved",
  "happy",
  "sad",
  "confused",
  "shocked",
  "thoughtful",
];

type JournalEditorProps = {
  movie?: Movie;
  userMovie?: UserMovie;
};

export default function JournalEditor({ movie, userMovie }: JournalEditorProps) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [kind, setKind] = useState<JournalKind>("diary");
  const [visibility, setVisibility] = useState<JournalVisibility>("private");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const isBodyValid = body.trim().length > 0;

  function handleSave() {
    setAttemptedSave(true);

    if (!isBodyValid) return;

    const movieId = movie?.id ?? "unknown-movie";
    const entry: JournalEntry = {
      id: `journal-${movieId}-${Date.now()}`,
      movieId,
      date: today,
      title: title.trim() || undefined,
      body: body.trim(),
      mood: mood.trim().toLowerCase() as JournalMood | undefined,
      kind,
      visibility,
      containsSpoilers,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingEntries = readLocalJournalEntries();
    window.localStorage.setItem(
      localJournalStorageKey,
      JSON.stringify([entry, ...existingEntries])
    );

    router.push(`/my/journal/${entry.id}`);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center md:p-5">
        <div className="h-24 w-16 flex-none overflow-hidden rounded-xl border border-white/10 bg-neutral-900 md:h-[108px] md:w-[72px]">
          <div className="relative h-full w-full">
            {movie?.poster ? (
              <Image
                src={movie.poster}
                alt={movie.title}
                fill
                sizes="72px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(0,0,0,0.72))]" />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Journal Editor
          </p>
          <h1 className="mt-2 line-clamp-1 text-2xl font-semibold text-white md:text-3xl">
            {movie?.title ?? "New Journal"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-400">
            <span>{formatEditorRating(userMovie?.myRating)}</span>
            <span>{userMovie?.watchedDate ?? "Watch date not recorded"}</span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="space-y-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Body
            </span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What do you want to remember about this film?"
              rows={8}
              className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
            />
            {attemptedSave && !isBodyValid && (
              <p className="mt-2 text-sm text-red-300">
                Body is required before saving.
              </p>
            )}
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Mood
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMood(option)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    mood === option
                      ? "border-white/25 bg-white/10 text-white"
                      : "border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {formatLabel(option)}
                </button>
              ))}
            </div>
            <input
              value={mood}
              onChange={(event) => setMood(event.target.value)}
              placeholder="Or write your own mood"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/25"
            />
          </div>

          <SegmentedControl
            label="Kind"
            value={kind}
            options={[
              { label: "Diary", value: "diary" },
              { label: "Study Note", value: "study-note" },
            ]}
            onChange={(value) => setKind(value as JournalKind)}
          />

          <SegmentedControl
            label="Visibility"
            value={visibility}
            options={[
              { label: "Private", value: "private" },
              { label: "Public", value: "public" },
            ]}
            onChange={(value) => setVisibility(value as JournalVisibility)}
          />

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <span>
              <span className="block text-sm font-semibold text-white">
                Contains Spoilers
              </span>
              <span className="mt-1 block text-sm text-neutral-500">
                Mark this memory before future reading.
              </span>
            </span>
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(event) => setContainsSpoilers(event.target.checked)}
              className="h-5 w-5 accent-white"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-1">
            <AtlasButton onClick={handleSave}>Save</AtlasButton>
            <AtlasButton
              href={movie ? `/movies/${movie.id}` : "/my/journal"}
              variant="secondary"
            >
              Cancel
            </AtlasButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function readLocalJournalEntries(): JournalEntry[] {
  try {
    const rawEntries = window.localStorage.getItem(localJournalStorageKey);
    if (!rawEntries) return [];

    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              value === option.value
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatEditorRating(rating?: number) {
  if (!rating || rating <= 0) return "Rating not recorded";

  return `${rating.toFixed(1)} / 5`;
}

import Image from "next/image";
import Link from "next/link";

export type TimelineMovieItem = {
  id: string;
  year: number;
  title: string;
  originalTitle: string;
  poster: string;
};

type FilmographyTimelineProps = {
  title?: string;
  items: TimelineMovieItem[];
  emptyMessage?: string;
};

export default function FilmographyTimeline({
  title = "Filmography Timeline",
  items,
  emptyMessage = "No films have been added yet.",
}: FilmographyTimelineProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        <p className="text-neutral-400">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">{title}</h2>

      <div className="relative space-y-6 border-l border-white/10 pl-6">
        {items.map((movie) => (
          <div key={movie.id} className="relative">
            <div className="absolute -left-[31px] top-2 h-3 w-3 rounded-full border border-white/20 bg-neutral-950" />

            <p className="mb-3 text-sm font-semibold text-neutral-500">
              {movie.year}
            </p>

            <Link
              href={`/movies/${movie.id}`}
              className="group flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
            >
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                <Image
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-white group-hover:underline">
                  {movie.title}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  {movie.originalTitle}
                </p>

                <p className="mt-4 text-sm font-medium text-neutral-400">
                  View Film →
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
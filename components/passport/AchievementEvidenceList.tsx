import AtlasCard from "@/components/ui/AtlasCard";
import type { Movie } from "@/types/movie";

type AchievementEvidenceListProps = {
  movies: Movie[];
};

export default function AchievementEvidenceList({
  movies,
}: AchievementEvidenceListProps) {
  if (movies.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-500">
        No movie evidence is attached yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {movies.map((movie) => (
        <AtlasCard key={movie.id} href={`/movies/${movie.id}`} className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Movie Evidence
          </p>
          <h3 className="mt-2 font-semibold text-white">{movie.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {movie.year} · {movie.country}
          </p>
        </AtlasCard>
      ))}
    </div>
  );
}

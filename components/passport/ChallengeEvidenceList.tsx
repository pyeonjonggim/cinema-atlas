import AtlasCard from "@/components/ui/AtlasCard";
import type { Movie } from "@/types/movie";

type ChallengeEvidenceListProps = {
  title: string;
  marker: string;
  movies: Movie[];
  emptyText: string;
};

export default function ChallengeEvidenceList({
  title,
  marker,
  movies,
  emptyText,
}: ChallengeEvidenceListProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </h3>

      {movies.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {movies.map((movie) => (
            <AtlasCard key={movie.id} href={`/movies/${movie.id}`} className="p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-neutral-400">{marker}</span>
                <div>
                  <h4 className="font-semibold text-white">{movie.title}</h4>
                  <p className="mt-1 text-sm text-neutral-500">
                    {movie.year} · {movie.country}
                  </p>
                </div>
              </div>
            </AtlasCard>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-500">
          {emptyText}
        </p>
      )}
    </div>
  );
}

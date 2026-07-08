import AtlasButton from "../ui/AtlasButton";
import RatingInput from "../journal/RatingInput";
import WatchStatus from "../journal/WatchStatus";

type MovieActionBarPatternProps = {
  averageRating: number;
  myRating?: number;
};

export default function MovieActionBarPattern({
  averageRating,
  myRating = 0,
}: MovieActionBarPatternProps) {
  const hasRating = myRating > 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Average Rating
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              **** {averageRating.toFixed(1)}
            </p>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {hasRating ? "My Rating" : "Rate This Film"}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <RatingInput value={hasRating ? myRating : 0} disabled />
              {hasRating && (
                <span className="text-sm font-medium text-neutral-300">
                  {myRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AtlasButton variant="secondary">
            {hasRating ? "Edit Rating" : "Rate This Film"}
          </AtlasButton>
          <AtlasButton variant="secondary">Write Journal</AtlasButton>
          <AtlasButton variant="secondary">Add to Watchlist</AtlasButton>
          <WatchStatus status="watched" />
        </div>
      </div>
    </section>
  );
}

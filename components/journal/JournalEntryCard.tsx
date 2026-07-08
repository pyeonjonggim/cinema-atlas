import AtlasCard from "../ui/AtlasCard";
import RatingInput from "./RatingInput";
import WatchStatus from "./WatchStatus";

type JournalEntryCardProps = {
  href?: string;
  title: string;
  watchedDate: string;
  rating: number;
  excerpt: string;
  status?: "plan" | "watching" | "watched" | "rewatch";
};

export default function JournalEntryCard({
  href,
  title,
  watchedDate,
  rating,
  excerpt,
  status = "watched",
}: JournalEntryCardProps) {
  return (
    <AtlasCard href={href}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            {watchedDate}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {title}
          </h3>
        </div>

        <WatchStatus status={status} />
      </div>

      <div className="mt-5">
        <RatingInput
          value={rating}
          disabled
        />
      </div>

      <p className="mt-5 line-clamp-4 text-sm leading-7 text-neutral-400">
        {excerpt}
      </p>

      <p className="mt-6 text-sm font-semibold text-neutral-300">
        Read Journal →
      </p>
    </AtlasCard>
  );
}
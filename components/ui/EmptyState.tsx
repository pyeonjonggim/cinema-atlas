import AtlasButton from "./AtlasButton";

type EmptyStatePreset =
  | "default"
  | "search"
  | "journal"
  | "passport"
  | "collection"
  | "error"
  | "notFound";

type EmptyStateProps = {
  preset?: EmptyStatePreset;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

const presetContent: Record<
  EmptyStatePreset,
  {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  }
> = {
  default: {
    title: "Nothing here yet.",
    description: "This space is ready for your next cinema journey.",
  },
  search: {
    title: "We couldn't find that.",
    description: "Try another search or start a new journey.",
    actionLabel: "Start Exploring",
    actionHref: "/explore",
  },
  journal: {
    title: "Your story starts here.",
    description:
      "Watch your first film and begin your Atlas Journal.",
    actionLabel: "Browse Movies",
    actionHref: "/movies",
  },
  passport: {
    title: "Every explorer starts somewhere.",
    description:
      "Begin a journey and collect your first stamp.",
    actionLabel: "Open Explore",
    actionHref: "/explore",
  },
  collection: {
    title: "Your collection is waiting.",
    description:
      "Save films, build paths, and shape your own cinema map.",
    actionLabel: "Browse Movies",
    actionHref: "/movies",
  },
  error: {
    title: "Something went off the reel.",
    description:
      "Try again, or return to the map and continue exploring.",
    actionLabel: "Return Home",
    actionHref: "/",
  },
  notFound: {
    title: "Looks like you've wandered off the map.",
    description:
      "Return home or continue exploring Cinema Atlas.",
    actionLabel: "Return Home",
    actionHref: "/",
  },
};

export default function EmptyState({
  preset = "default",
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const content = presetContent[preset];

  const resolvedTitle = title ?? content.title;
  const resolvedDescription = description ?? content.description;
  const resolvedActionLabel = actionLabel ?? content.actionLabel;
  const resolvedActionHref = actionHref ?? content.actionHref;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12 text-center">
      <div className="mx-auto max-w-xl">
        <h2 className="text-2xl font-bold text-white">
          {resolvedTitle}
        </h2>

        <p className="mt-4 leading-7 text-neutral-400">
          {resolvedDescription}
        </p>

        {resolvedActionLabel && resolvedActionHref && (
          <div className="mt-8">
            <AtlasButton href={resolvedActionHref}>
              {resolvedActionLabel} →
            </AtlasButton>
          </div>
        )}
      </div>
    </div>
  );
}
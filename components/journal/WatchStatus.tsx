type WatchStatus =
  | "plan"
  | "watching"
  | "watched"
  | "rewatch";

type WatchStatusProps = {
  status: WatchStatus;
};

export default function WatchStatus({
  status,
}: WatchStatusProps) {
  const config = {
    plan: {
      label: "Plan to Watch",
      className:
        "border-neutral-700 bg-neutral-800/40 text-neutral-300",
    },
    watching: {
      label: "Watching",
      className:
        "border-blue-500/20 bg-blue-500/10 text-blue-300",
    },
    watched: {
      label: "Watched",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },
    rewatch: {
      label: "Rewatch",
      className:
        "border-purple-500/20 bg-purple-500/10 text-purple-300",
    },
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${config[status].className}`}
    >
      {config[status].label}
    </span>
  );
}
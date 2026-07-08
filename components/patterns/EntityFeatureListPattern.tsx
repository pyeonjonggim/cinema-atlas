import Section from "../layout/Section";

type EntityFeatureListPatternProps = {
  title: string;
  description?: string;
  items: string[];
  emptyMessage?: string;
};

export default function EntityFeatureListPattern({
  title,
  description,
  items,
  emptyMessage = "This section will expand as the Encyclopedia grows.",
}: EntityFeatureListPatternProps) {
  return (
    <Section title={title} description={description} className="p-4 md:p-5">
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <p className="text-sm leading-6 text-neutral-300">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">{emptyMessage}</p>
      )}
    </Section>
  );
}

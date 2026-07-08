type FeatureListPatternProps = {
  title: string;
  features: string[];
};

export default function FeatureListPattern({
  title,
  features,
}: FeatureListPatternProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">
        {title}
      </h2>

      <ul className="space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex gap-3 rounded-xl bg-black/20 p-4"
          >
            <span className="mt-1 text-neutral-400">•</span>

            <span className="leading-7 text-neutral-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
import Section from "../layout/Section";

type MovieContextPatternProps = {
  themes?: string[];
  style?: string[];
  historicalContext?: string[];
};

function ContextGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-neutral-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MovieContextPattern({
  themes = [],
  style = [],
  historicalContext = [],
}: MovieContextPatternProps) {
  const hasContent =
    themes.length > 0 || style.length > 0 || historicalContext.length > 0;

  return (
    <Section
      title="Themes, Style, and Historical Context"
      description="A compact reading map before moving into connected cinema."
    >
      {hasContent ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <ContextGroup title="Themes" items={themes} />
          <ContextGroup title="Style" items={style} />
          <ContextGroup title="Historical Context" items={historicalContext} />
        </div>
      ) : (
        <p className="text-sm text-neutral-400">
          Context notes will appear as this film entry grows.
        </p>
      )}
    </Section>
  );
}

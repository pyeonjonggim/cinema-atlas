export type QuickFactItem = {
  label: string;
  value: string | number;
};

type QuickFactsProps = {
  facts: QuickFactItem[];
};

export default function QuickFacts({ facts }: QuickFactsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-2xl bg-black/20 p-4">
          <p className="text-sm text-neutral-500">{fact.label}</p>

          <p className="mt-1 text-white">{fact.value}</p>
        </div>
      ))}
    </div>
  );
}
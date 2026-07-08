import Section from "../layout/Section";

type EntityOverviewPatternProps = {
  title: string;
  description: string;
};

export default function EntityOverviewPattern({
  title,
  description,
}: EntityOverviewPatternProps) {
  return (
    <Section title={title}>
      <div className="max-w-4xl">
        <p className="leading-8 text-neutral-300">
          {description}
        </p>
      </div>
    </Section>
  );
}
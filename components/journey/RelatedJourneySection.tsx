import Section from "@/components/layout/Section";
import JourneyCard from "@/components/journey/JourneyCard";
import type { JourneyProjection } from "@/types/journey";

type RelatedJourneySectionProps = {
  journeys: JourneyProjection[];
};

export default function RelatedJourneySection({
  journeys,
}: RelatedJourneySectionProps) {
  if (journeys.length === 0) {
    return null;
  }

  return (
    <Section
      eyebrow="Related Journeys"
      title="Where this path can lead next"
      description="Related Journeys stay close to the current theme without repeating the same route."
      className="p-4 md:p-5"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {journeys.slice(0, 3).map((journey) => (
          <JourneyCard key={journey.id} journey={journey} steps={journey.steps} />
        ))}
      </div>
    </Section>
  );
}

import Section from "@/components/layout/Section";
import JourneyCard from "@/components/journey/JourneyCard";
import type { Journey } from "@/types/journey";

type RelatedJourneySectionProps = {
  journeys: Journey[];
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {journeys.map((journey) => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>
    </Section>
  );
}

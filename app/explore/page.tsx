import Link from "next/link";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import JourneyCard from "@/components/journey/JourneyCard";
import {
  selectFeaturedPublishedJourney,
  selectPublishedJourneys,
} from "@/lib/journeyQuery";

const futureJourneyPrompts = [
  "A route through loneliness in city cinema",
  "A route from one actor to a national cinema",
  "A route through festival winners outside Hollywood",
  "A route from silent cinema to modern visual style",
];

export default async function ExplorePage() {
  const featuredJourney = await selectFeaturedPublishedJourney({
    purpose: "daily-feature",
    minSteps: 8,
    seed: "explore-v1-featured",
  });
  const supportingJourneys = (
    await selectPublishedJourneys({
      purpose: "deep-route",
      minSteps: 8,
      seed: "explore-v1-supporting",
      limit: 3,
    })
  ).filter((journey) => journey.id !== featuredJourney?.id);
  const journeyModes = [
    {
      title: "Start with a country",
      description:
        "A route where place becomes the first question, then opens movements, directors, films, and performers.",
      journeyId: (
        await selectFeaturedPublishedJourney({ category: "country", minSteps: 8 })
      )?.id,
    },
    {
      title: "Start with a movement",
      description:
        "A route where style and historical change come first, before individual films become examples.",
      journeyId: (
        await selectFeaturedPublishedJourney({ category: "movement", minSteps: 8 })
      )?.id,
    },
    {
      title: "Start with recognition",
      description:
        "A route where an award becomes a way to understand canon, memory, industry, and international attention.",
      journeyId: (
        await selectFeaturedPublishedJourney({ category: "award", minSteps: 8 })
      )?.id,
    },
  ];

  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <UniversalHero
            eyebrow="Explore"
            title="Choose a journey, not a category."
            description="Explore is Cinema Atlas in motion: curated routes that connect films, people, countries, movements, and awards into one learning path."
            visualTone="explorer"
            minHeight="compact"
          />

          {featuredJourney && (
            <Section
              eyebrow="Today's Journey"
              title="A curated route to begin with"
              description="The first screen should offer one strong path rather than asking you to browse the whole archive."
              className="p-4 md:p-5"
            >
              <JourneyCard
                journey={featuredJourney}
                steps={featuredJourney.steps}
                variant="featured"
              />
            </Section>
          )}

          <Section
            eyebrow="Journey Modes"
            title="How do you want to enter cinema?"
            description="Each mode still leads to a full Journey. The difference is the first kind of question it asks."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {journeyModes.map((mode) => (
                <Link
                  key={mode.title}
                  href={
                    mode.journeyId
                      ? `/explore/journeys/${mode.journeyId}`
                      : "/explore/journeys"
                  }
                  className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Journey Mode
                  </p>
                  <h3 className="mt-8 text-2xl font-semibold tracking-tight text-white">
                    {mode.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-400">
                    {mode.description}
                  </p>
                  <p className="mt-7 text-sm font-semibold text-neutral-300 transition group-hover:text-white">
                    Enter Journey
                  </p>
                </Link>
              ))}
            </div>
          </Section>

          {supportingJourneys.length > 0 && (
            <Section
              eyebrow="Journey Library"
              title="More guided routes"
              description="These are not entity cards. Each one is a sequence built to teach connection, context, and next questions."
              className="p-4 md:p-5"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {supportingJourneys.map((journey) => (
                  <JourneyCard key={journey.id} journey={journey} steps={journey.steps} />
                ))}
              </div>
            </Section>
          )}

          <Section
            eyebrow="Coming Journey Seeds"
            title="Future routes the atlas can grow into"
            description="Explore can hold unfinished ideas without pretending they are full Encyclopedia entries yet."
            className="p-4 md:p-5"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {futureJourneyPrompts.map((prompt, index) => (
                <div
                  key={prompt}
                  className="rounded-3xl border border-dashed border-white/12 bg-white/[0.02] p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
                    Seed {index + 1}
                  </p>
                  <p className="mt-8 text-lg font-semibold leading-7 text-neutral-300">
                    {prompt}
                  </p>
                  <p className="mt-5 text-xs text-neutral-600">
                    Editorial route candidate
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.025] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Reference Mode
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Looking for a specific title, person, country, movement, or
                award? Use Search or Encyclopedia as tools after Explore gives
                you a path.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/search"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
              >
                Search
              </Link>
              <Link
                href="/encyclopedia"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-white/25 hover:text-white"
              >
                Encyclopedia
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

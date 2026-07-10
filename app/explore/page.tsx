import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import UniversalHero from "@/components/layout/UniversalHero";
import AtlasButton from "@/components/ui/AtlasButton";
import ExploreEntryCard from "@/components/explore/ExploreEntryCard";
import JourneyCard from "@/components/journey/JourneyCard";
import EntityContinueJourneyPattern from "@/components/patterns/EntityContinueJourneyPattern";
import { officialJourneys } from "@/data/journeys";

const startExploring = [
  {
    href: "/encyclopedia/countries",
    label: "Start Exploring",
    title: "Explore by Country",
    description:
      "Begin with national cinemas and move into films, directors, movements, and awards.",
    meta: "World cinema",
    tone: "country" as const,
  },
  {
    href: "/encyclopedia/directors",
    label: "Start Exploring",
    title: "Explore by Director",
    description:
      "Follow a filmmaker's style, themes, collaborators, and essential films.",
    meta: "Filmmakers",
    tone: "director" as const,
  },
  {
    href: "/encyclopedia/movements",
    label: "Start Exploring",
    title: "Explore by Movement",
    description:
      "Enter cinema history through shared ideas, eras, forms, and visual languages.",
    meta: "Film history",
    tone: "movement" as const,
  },
  {
    href: "/encyclopedia/awards",
    label: "Start Exploring",
    title: "Explore by Award",
    description:
      "Discover how festivals and institutions record the history of cinema.",
    meta: "Recognition",
    tone: "award" as const,
  },
];

const categories = [
  {
    href: "/encyclopedia/movies",
    label: "Category",
    title: "Movie",
    description: "Start from a film and move into its people, places, and history.",
  },
  {
    href: "/encyclopedia/directors",
    label: "Category",
    title: "Director",
    description: "Explore cinema through authorship, style, and influence.",
  },
  {
    href: "/encyclopedia/actors",
    label: "Category",
    title: "Actor",
    description: "Follow screen personas, roles, and collaborations.",
  },
  {
    href: "/encyclopedia/countries",
    label: "Category",
    title: "Country",
    description: "Discover national cinema through context and history.",
  },
  {
    href: "/encyclopedia/movements",
    label: "Category",
    title: "Movement",
    description: "Understand cinema through shared ideas and eras.",
  },
  {
    href: "/encyclopedia/awards",
    label: "Category",
    title: "Award",
    description: "Trace how cinema is recognized, remembered, and canonized.",
  },
];

const regions = [
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Asia",
    description: "Explore Japanese, Korean, Iranian, Indian, and wider Asian cinemas.",
    tone: "country" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Europe",
    description: "Move through neorealism, new waves, festivals, and national traditions.",
    tone: "movement" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "North America",
    description: "Follow Hollywood, independent cinema, genres, and studio histories.",
    tone: "director" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Latin America",
    description: "Enter political cinema, poetic realism, and regional film cultures.",
    tone: "country" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Middle East",
    description: "Discover cinema shaped by memory, family, politics, and daily life.",
    tone: "movement" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Africa",
    description: "Explore postcolonial cinema, oral tradition, cities, and migration.",
    tone: "country" as const,
  },
  {
    href: "/encyclopedia/countries",
    label: "Region",
    title: "Oceania",
    description: "Start with island cinema, Indigenous stories, and regional auteurs.",
    tone: "default" as const,
  },
];

const themes = [
  "Coming of Age",
  "War",
  "Family",
  "Loneliness",
  "Revenge",
  "Love",
].map((theme) => ({
  href: "/encyclopedia/movies",
  label: "Theme Placeholder",
  title: theme,
  description:
    "A future theme path that will connect films, directors, countries, and movements.",
  meta: "Coming later",
}));

const collections = [
  {
    href: "/encyclopedia/movies",
    label: "Official Collection Placeholder",
    title: "100 Films to Start Cinema",
    description:
      "A future official collection for building a foundation across film history.",
    meta: "Official",
  },
  {
    href: "/encyclopedia/countries",
    label: "Official Collection Placeholder",
    title: "Around the World",
    description:
      "A future collection that helps users move across regions and national cinemas.",
    meta: "World cinema",
  },
  {
    href: "/encyclopedia/awards/academy-best-picture",
    label: "Official Collection Placeholder",
    title: "Palme d'Or Winners",
    description:
      "A future collection for following major festival recognition and canon formation.",
    meta: "Awards",
  },
  {
    href: "/encyclopedia/directors",
    label: "Official Collection Placeholder",
    title: "Women Directors",
    description:
      "A future collection highlighting filmmakers, movements, and historical context.",
    meta: "Directors",
  },
];

const continueJourneyItems = [
  {
    label: "Knowledge Hub",
    title: "Browse the Encyclopedia",
    description:
      "Move from discovery into connected cinema knowledge.",
    href: "/encyclopedia",
    level: "primary" as const,
  },
  {
    label: "Exploration System",
    title: "Open Your Passport",
    description:
      "Turn curiosity into active challenges and long-term exploration.",
    href: "/passport",
    level: "deep" as const,
  },
  {
    label: "First Step",
    title: "Start with Movies",
    description:
      "Choose a film, then follow its relationships outward.",
    href: "/encyclopedia/movies",
    level: "secondary" as const,
  },
  {
    label: "Personal Space",
    title: "Return to My Atlas",
    description:
      "Review your activity, journals, collections, and insights.",
    href: "/my",
    level: "secondary" as const,
  },
];

export default function ExplorePage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <UniversalHero
            eyebrow="Explore"
            title="Explore Cinema"
            description="Discover films, cultures, and stories through guided exploration."
          />

          <Section
            eyebrow="Start Exploring"
            title="Choose your first path"
            description="Explore works best when you can begin without knowing exactly what to search for."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {startExploring.map((entry) => (
                <ExploreEntryCard key={entry.title} {...entry} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Official Journeys"
            title="Guided routes through cinema"
            description="Official Journeys are Cinema Atlas curated learning paths, not collections or challenges."
            action={
              <AtlasButton href="/explore/journeys" variant="secondary">
                View Journey Library
              </AtlasButton>
            }
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {officialJourneys.slice(0, 4).map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Explore by Category"
            title="Enter through the knowledge graph"
            description="Every category leads into the Encyclopedia and then outward through related entities."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {categories.map((entry) => (
                <ExploreEntryCard key={entry.title} {...entry} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Explore by Region"
            title="Travel through world cinema"
            description="Regional entries currently lead to Country Encyclopedia, ready for future region pages."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {regions.map((entry) => (
                <ExploreEntryCard key={entry.title} {...entry} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Explore by Theme"
            title="Begin with a feeling or idea"
            description="Theme paths are placeholders for future guided discovery, not a search engine."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {themes.map((entry) => (
                <ExploreEntryCard key={entry.title} {...entry} />
              ))}
            </div>
          </Section>

          <Section
            eyebrow="Featured Collections"
            title="Official collections coming later"
            description="These placeholders reserve space for curated Cinema Atlas collections without implementing collection details yet."
            className="p-4 md:p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {collections.map((entry) => (
                <ExploreEntryCard key={entry.title} {...entry} />
              ))}
            </div>
          </Section>

          <EntityContinueJourneyPattern
            title="Continue Your Journey"
            description="Explore should always point toward the next meaningful destination."
            items={continueJourneyItems}
          />
        </div>
      </PageContainer>
    </>
  );
}

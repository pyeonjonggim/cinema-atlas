import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import UniversalHero from "@/components/layout/UniversalHero";
import AtlasButton from "@/components/ui/AtlasButton";
import EntityCard from "@/components/entity/EntityCard";
import DiscoveryShelf from "@/components/discovery/DiscoveryShelf";
import JourneyCard from "@/components/discovery/JourneyCard";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";

const featuredEncyclopedia = [
  {
    href: "/encyclopedia/countries/japan",
    category: "Starter Journey",
    title: "Start with Japanese Cinema",
    subtitle:
      "Move from classic samurai cinema into family dramas, animation, and modern auteurs.",
    difficulty: "Beginner",
    stops: 5,
    movieCount: 8,
    viewingTime: "12h",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    category: "Movement",
    title: "Understanding French New Wave",
    subtitle:
      "Follow the movement that changed film language through youth, politics, and experimentation.",
    difficulty: "Intermediate",
    stops: 6,
    movieCount: 10,
    viewingTime: "15h",
  },
  {
    href: "/encyclopedia/awards/palme-dor",
    category: "Award",
    title: "The History of Cannes",
    subtitle:
      "Explore how one festival shaped the global conversation around cinema.",
    difficulty: "Beginner",
    stops: 4,
    movieCount: 7,
    viewingTime: "10h",
  },
  {
    href: "/encyclopedia/movements",
    category: "Timeline",
    title: "World Cinema Timeline",
    subtitle:
      "Trace cinema through movements, countries, awards, and historical turning points.",
    difficulty: "Beginner",
    stops: 8,
    movieCount: 12,
    viewingTime: "18h",
  },
];

const categories = [
  {
    href: "/encyclopedia/movies",
    label: "Category",
    title: "Movie",
    description:
      "Explore films as connected works: directors, countries, movements, actors, and awards.",
  },
  {
    href: "/encyclopedia/directors",
    label: "Category",
    title: "Director",
    description:
      "Meet the filmmakers whose choices shaped cinematic language and history.",
  },
  {
    href: "/encyclopedia/countries",
    label: "Category",
    title: "Country",
    description:
      "Discover national cinemas through context, history, filmmakers, and movements.",
  },
  {
    href: "/encyclopedia/movements",
    label: "Category",
    title: "Movement",
    description:
      "Understand cinema through shared ideas, styles, eras, and historical shifts.",
  },
  {
    href: "/encyclopedia/actors",
    label: "Category",
    title: "Actor",
    description:
      "Follow screen personas, key roles, collaborations, and performance histories.",
  },
  {
    href: "/encyclopedia/awards",
    label: "Category",
    title: "Award",
    description:
      "Explore how institutions, festivals, and prizes record cinema history.",
  },
];

const recommendedEntries = [
  {
    href: "/encyclopedia/directors/akira-kurosawa",
    label: "Director",
    title: "Akira Kurosawa",
    description:
      "A strong starting point for exploring Japanese cinema and global film influence.",
    badge: "Start Here",
  },
  {
    href: "/encyclopedia/countries/japan",
    label: "Country",
    title: "Japan",
    description:
      "A rich national cinema that connects genre, family drama, animation, and modern auteurs.",
    badge: "Essential",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    label: "Movement",
    title: "French New Wave",
    description:
      "A key movement for understanding modern editing, youth culture, and cinematic freedom.",
    badge: "Essential",
  },
  {
    href: "/encyclopedia/awards/palme-dor",
    label: "Award",
    title: "Palme d'Or",
    description:
      "A gateway into festival cinema and the international canon.",
    badge: "Award",
  },
];

const continueReading = [
  {
    href: "/encyclopedia/directors/federico-fellini",
    label: "Director",
    title: "Federico Fellini",
    description:
      "Continue into a world of memory, spectacle, dreams, and modern European cinema.",
  },
  {
    href: "/encyclopedia/countries/italy",
    label: "Country",
    title: "Italy",
    description:
      "Move from neorealism into postwar modernism, genre cinema, and festival history.",
  },
  {
    href: "/encyclopedia/movements/film-noir",
    label: "Movement",
    title: "Film Noir",
    description:
      "Explore crime, shadow, moral uncertainty, and postwar cinematic style.",
  },
];

const recentlyUpdated = [
  {
    href: "/encyclopedia/directors/andrei-tarkovsky",
    label: "Director",
    title: "Andrei Tarkovsky",
    description:
      "Study time, spirituality, memory, and the long take as cinematic language.",
  },
  {
    href: "/encyclopedia/countries/south-korea",
    label: "Country",
    title: "South Korea",
    description:
      "Explore genre, class, global recognition, and contemporary Korean cinema.",
  },
  {
    href: "/encyclopedia/movements/neo-realism",
    label: "Movement",
    title: "Neo-Realism",
    description:
      "Understand how postwar realism reshaped cinema around ordinary lives.",
  },
  {
    href: "/encyclopedia/awards/venice-film-festival",
    label: "Award",
    title: "Venice Film Festival",
    description:
      "Enter one of cinema's oldest festival traditions and its history of recognition.",
  },
];

export default function EncyclopediaHomePage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <UniversalHero
            eyebrow="Cinema Encyclopedia"
            title="Encyclopedia"
            description="Search and explore the connected knowledge of cinema: movies, directors, countries, movements, actors, and awards."
            search={
              <div className="flex w-full items-center rounded-full border border-white/10 bg-black/35 px-5 py-3 text-sm text-neutral-500 backdrop-blur">
                Search the Encyclopedia...
              </div>
            }
            stats="6 categories"
          />

          <DiscoveryShelf
            title="Featured Encyclopedia"
            description="Begin with guided entries that connect films, people, places, movements, and awards."
            action={
              <AtlasButton href="/encyclopedia/directors" variant="ghost">
                View all
              </AtlasButton>
            }
            columns="four"
          >
            {featuredEncyclopedia.map((item) => (
              <JourneyCard key={item.title} {...item} />
            ))}
          </DiscoveryShelf>

          <DiscoveryShelf
            title="Browse by Category"
            description="Choose the knowledge path you want to enter: films, filmmakers, countries, movements, actors, or awards."
            columns="four"
          >
            <div className="col-span-full grid gap-5 md:grid-cols-2 xl:grid-cols-6">
              {categories.map((category) => (
                <EntityCard key={category.title} {...category} />
              ))}
            </div>
          </DiscoveryShelf>

          <RecommendedShelfPattern
            title="Recommended Starting Points"
            description="Not sure where to begin? These entries open strong paths through cinema history."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                Browse all
              </AtlasButton>
            }
          >
            {recommendedEntries.map((entry) => (
              <EntityCard key={entry.title} {...entry} />
            ))}
          </RecommendedShelfPattern>

          <DiscoveryShelf
            title="Continue Reading"
            description="Resume the learning paths that naturally lead into another cinematic journey."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                View all
              </AtlasButton>
            }
            columns="three"
          >
            {continueReading.map((entry) => (
              <EntityCard key={entry.title} {...entry} />
            ))}
          </DiscoveryShelf>

          <DiscoveryShelf
            title="Recently Updated"
            description="Freshly expanded entries across the Cinema Atlas knowledge graph."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                View all
              </AtlasButton>
            }
            columns="four"
          >
            {recentlyUpdated.map((entry) => (
              <EntityCard key={entry.title} {...entry} />
            ))}
          </DiscoveryShelf>

          <footer className="border-t border-white/10 py-8 text-sm text-neutral-500">
            Cinema Atlas / Encyclopedia / Directors / Countries / Movements /
            Actors / Awards
          </footer>
        </div>
      </PageContainer>
    </>
  );
}

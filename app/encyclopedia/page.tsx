import GlobalNavigation from "@/components/navigation/GlobalNavigation";

import PageContainer from "@/components/layout/PageContainer";
import BaseHero from "@/components/layout/BaseHero";
import CTAGroup from "@/components/layout/CTAGroup";

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
    subtitle: "일본 영화의 역사와 미학을 한눈에 탐험합니다.",
    difficulty: "Beginner",
    stops: 5,
    movieCount: 8,
    viewingTime: "12h",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    category: "Movement",
    title: "Understanding French New Wave",
    subtitle: "누벨바그의 탄생과 현대 영화 언어의 변화를 따라갑니다.",
    difficulty: "Intermediate",
    stops: 6,
    movieCount: 10,
    viewingTime: "15h",
  },
  {
    href: "/encyclopedia/awards/palme-dor",
    category: "Award",
    title: "The History of Cannes",
    subtitle: "칸 영화제가 만든 세계 영화사의 흐름을 탐험합니다.",
    difficulty: "Beginner",
    stops: 4,
    movieCount: 7,
    viewingTime: "10h",
  },
  {
    href: "/encyclopedia/movements",
    category: "Timeline",
    title: "World Cinema Timeline",
    subtitle: "세계 영화사의 주요 흐름을 시대별로 이해합니다.",
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
      "영화 자체를 중심으로 감독, 국가, 사조, 배우, 수상을 탐험하세요.",
  },
  {
    href: "/encyclopedia/directors",
    label: "Category",
    title: "Director",
    description: "영화의 세계를 만든 감독들을 탐험하세요.",
  },
  {
    href: "/encyclopedia/countries",
    label: "Category",
    title: "Country",
    description: "국가별 영화 역사와 문화를 발견하세요.",
  },
  {
    href: "/encyclopedia/movements",
    label: "Category",
    title: "Movement",
    description: "영화 운동과 사조의 흐름을 이해해 보세요.",
  },
  {
    href: "/encyclopedia/actors",
    label: "Category",
    title: "Actor",
    description: "시대를 빛낸 배우들의 작품과 여정을 살펴보세요.",
  },
  {
    href: "/encyclopedia/awards",
    label: "Category",
    title: "Award",
    description: "영화제와 수상의 역사를 탐험하세요.",
  },
];

const recommendedEntries = [
  {
    href: "/encyclopedia/directors/akira-kurosawa",
    label: "Director",
    title: "Akira Kurosawa",
    description: "일본 영화와 세계 영화사의 중요한 출발점입니다.",
    badge: "Start Here",
  },
  {
    href: "/encyclopedia/countries/japan",
    label: "Country",
    title: "Japan",
    description: "국가 영화사와 미학을 함께 이해하기 좋은 입구입니다.",
    badge: "Essential",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    label: "Movement",
    title: "French New Wave",
    description: "영화 언어의 변화와 작가주의의 시작점을 이해하기 좋습니다.",
    badge: "Essential",
  },
  {
    href: "/encyclopedia/awards/palme-dor",
    label: "Award",
    title: "Palme d'Or",
    description: "칸 영화제가 만든 세계 영화사의 canon을 탐험합니다.",
    badge: "Award",
  },
];

const continueReading = [
  {
    href: "/encyclopedia/directors/federico-fellini",
    label: "Director",
    title: "Federico Fellini",
    description: "현실과 환상이 뒤섞이는 감독의 세계를 이어서 읽습니다.",
  },
  {
    href: "/encyclopedia/countries/italy",
    label: "Country",
    title: "Italy",
    description: "네오리얼리즘부터 현대 이탈리아 영화까지 연결합니다.",
  },
  {
    href: "/encyclopedia/movements/film-noir",
    label: "Movement",
    title: "Film Noir",
    description: "어둠, 범죄, 도시적 불안을 중심으로 한 영화 흐름입니다.",
  },
];

const recentlyUpdated = [
  {
    href: "/encyclopedia/directors/andrei-tarkovsky",
    label: "Director",
    title: "Andrei Tarkovsky",
    description: "시간과 영성의 영화 언어를 탐험합니다.",
  },
  {
    href: "/encyclopedia/countries/south-korea",
    label: "Country",
    title: "South Korea",
    description: "한국 영화의 장르, 작가, 세계적 확장을 살펴봅니다.",
  },
  {
    href: "/encyclopedia/movements/neo-realism",
    label: "Movement",
    title: "Neo-Realism",
    description: "전후 현실과 인간의 삶을 담은 영화 운동입니다.",
  },
  {
    href: "/encyclopedia/awards/venice-film-festival",
    label: "Award",
    title: "Venice Film Festival",
    description: "세계에서 가장 오래된 영화제의 흐름을 탐험합니다.",
  },
];

export default function EncyclopediaHomePage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <BaseHero
            eyebrow="Cinema Encyclopedia"
            title="Encyclopedia"
            subtitle="Explore cinema through people, countries, movements and awards."
            description="영화 세계를 이해하기 위한 지식의 입구입니다. 어디서부터 읽을지 고르고, 연결을 따라 탐험하세요."
          >
            <CTAGroup>
              <AtlasButton href="/encyclopedia/directors">
                Browse All →
              </AtlasButton>
              <AtlasButton href="/movies" variant="secondary">
                Search Encyclopedia →
              </AtlasButton>
            </CTAGroup>
          </BaseHero>

          <DiscoveryShelf
            title="Featured Encyclopedia"
            description="처음 읽기 좋은 대표 항목과 큐레이션된 지식 경로입니다."
            action={
              <AtlasButton href="/encyclopedia/directors" variant="ghost">
                View all →
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
            description="감독, 국가, 사조, 배우, 수상으로 영화 세계를 탐험하세요."
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
            description="무엇부터 읽을지 고민된다면 여기서 시작하세요."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                Browse all →
              </AtlasButton>
            }
          >
            {recommendedEntries.map((entry) => (
              <EntityCard key={entry.title} {...entry} />
            ))}
          </RecommendedShelfPattern>

          <DiscoveryShelf
            title="Continue Reading"
            description="최근 읽던 Encyclopedia 항목을 이어서 탐험합니다."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                View all →
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
            description="최근 추가되거나 정리된 Encyclopedia 항목입니다."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                View all →
              </AtlasButton>
            }
            columns="four"
          >
            {recentlyUpdated.map((entry) => (
              <EntityCard key={entry.title} {...entry} />
            ))}
          </DiscoveryShelf>

          <footer className="border-t border-white/10 py-8 text-sm text-neutral-500">
            Cinema Atlas · Encyclopedia · Directors · Countries · Movements ·
            Actors · Awards
          </footer>
        </div>
      </PageContainer>
    </>
  );
}
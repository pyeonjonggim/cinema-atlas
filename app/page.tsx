import Image from "next/image";
import Link from "next/link";
import { movies } from "@/data/movies";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import BaseHero from "@/components/layout/BaseHero";
import CTAGroup from "@/components/layout/CTAGroup";

import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";

import DiscoveryShelf from "@/components/discovery/DiscoveryShelf";
import JourneyCard from "@/components/discovery/JourneyCard";
import RecommendationCard from "@/components/discovery/RecommendationCard";
import PageContainer from "@/components/layout/PageContainer";
import RecommendedShelfPattern from "@/components/patterns/RecommendedShelfPattern";

type Movie = (typeof movies)[number];

const becauseYouWatchedMovies = movies.slice(6, 12);
const recentlyAddedMovies = movies.slice(-4);

const continueJourneyItems = [
  {
    label: "Journey",
    title: "World Cinema Map",
    description: "국가, 감독, 사조를 따라 다음 탐험을 이어가세요.",
    href: "/explore",
  },
  {
    label: "Country",
    title: "Japanese Cinema",
    description: "일본 영화의 감독, 사조, 대표작을 연결해 탐험합니다.",
    href: "/encyclopedia/countries/japan",
  },
  {
    label: "Director",
    title: "Akira Kurosawa",
    description: "스타일, 주제, 대표작을 따라 거장의 세계로 들어갑니다.",
    href: "/encyclopedia/directors/akira-kurosawa",
  },
];

const recommendedEntries = [
  {
    href: "/encyclopedia/directors/akira-kurosawa",
    title: "Akira Kurosawa",
    type: "Director",
    reason: "일본 영화와 세계 영화사의 중요한 출발점입니다.",
  },
  {
    href: "/encyclopedia/movements/french-new-wave",
    title: "French New Wave",
    type: "Movement",
    reason: "영화 언어의 변화와 작가주의를 이해하기 좋습니다.",
  },
  {
    href: "/encyclopedia/awards/palme-dor",
    title: "Palme d'Or",
    type: "Award",
    reason: "영화제가 만든 세계 영화사의 canon을 탐험합니다.",
  },
];

const featuredJourneys = [
  {
    href: "/explore",
    category: "Starter Journey",
    title: "From Japan to World Cinema",
    subtitle: "일본 영화에서 출발해 감독, 사조, 수상으로 확장합니다.",
    difficulty: "Beginner",
    stops: 5,
    movieCount: 8,
    viewingTime: "12h",
  },
  {
    href: "/explore",
    category: "Learning Path",
    title: "European New Wave",
    subtitle: "누벨바그와 현대 영화 언어의 출발점을 탐험합니다.",
    difficulty: "Intermediate",
    stops: 6,
    movieCount: 10,
    viewingTime: "15h",
  },
];

function SlimJourneyCard({
  label,
  title,
  description,
  href,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <AtlasCard
      href={href}
      className="p-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {label}
          </p>

          <h3 className="mt-1 truncate text-lg font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-neutral-400">
            {description}
          </p>
        </div>

        <span className="shrink-0 text-lg text-neutral-400">→</span>
      </div>
    </AtlasCard>
  );
}

function MoviePosterCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group min-w-[132px]">
      <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-xl group-hover:shadow-black/20">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            width={264}
            height={396}
            sizes="132px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No Poster
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-medium text-white">
        {movie.title}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{movie.year}</p>
    </Link>
  );
}

function MovieRowCard({ movie }: { movie: Movie }) {
  return (
    <AtlasCard
      href={`/movies/${movie.id}`}
      className="min-w-[260px] p-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="flex items-center gap-3">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-800">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              width={112}
              height={160}
              sizes="56px"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Movie
          </p>

          <h3 className="mt-1 line-clamp-1 font-semibold text-white">
            {movie.title}
          </h3>

          <p className="mt-1 text-sm text-neutral-500">{movie.year}</p>
        </div>

        <span className="ml-auto shrink-0 text-neutral-400">→</span>
      </div>
    </AtlasCard>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <BaseHero
            eyebrow="Travel the world through cinema"
            title="Cinema Atlas"
            subtitle="Every film opens a new world."
            description="영화를 기록하고, 탐험하고, 배우고, 연결하는 나만의 시네마 지도."
          >
          <CTAGroup>
            <AtlasButton href="/explore">Explore →</AtlasButton>
            <AtlasButton href="/encyclopedia" variant="secondary">
              Browse Encyclopedia →
            </AtlasButton>
          </CTAGroup>
          </BaseHero>

          {/* Continue Journey */}
          <DiscoveryShelf
            title="Continue Your Journey"
            description="국가, 감독, 사조를 따라 다음 탐험을 이어가세요."
            action={
              <AtlasButton href="/explore" variant="ghost">
                View all →
              </AtlasButton>
            }
            columns="three"
          >
            {continueJourneyItems.map((item) => (
              <SlimJourneyCard key={item.title} {...item} />
            ))}
          </DiscoveryShelf>

          {/* Recommended */}
          <RecommendedShelfPattern
            title="Recommended For You"
            description="추천 이유와 함께 Cinema Atlas에서 바로 시작할 수 있는 항목입니다."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                Browse all →
              </AtlasButton>
            }
          >
            {recommendedEntries.map((item) => (
              <RecommendationCard key={item.title} {...item} />
            ))}
          </RecommendedShelfPattern>

          {/* Because You Watched */}
          <DiscoveryShelf
            title="Because You Watched"
            description="이미 연결된 영화에서 출발해 다음 감상으로 이어집니다."
            action={
              <AtlasButton href="/movies" variant="ghost">
                View all →
              </AtlasButton>
            }
            columns="three"
          >
            <div className="col-span-full flex gap-4 overflow-x-auto pb-2">
              {becauseYouWatchedMovies.map((movie) => (
                <MovieRowCard key={movie.id} movie={movie} />
              ))}
            </div>
          </DiscoveryShelf>

          {/* Featured Explore */}
          <DiscoveryShelf
            title="Featured Explore"
            description="큐레이터가 추천하는 여정을 시작해보세요."
            action={
              <AtlasButton href="/explore" variant="ghost">
                View all →
              </AtlasButton>
            }
            columns="two"
          >
            {featuredJourneys.map((journey) => (
              <JourneyCard key={journey.title} {...journey} />
            ))}
          </DiscoveryShelf>

          {/* Continue Reading */}
          <DiscoveryShelf
            title="Continue Reading"
            description="Encyclopedia에서 이어서 읽기 좋은 항목입니다."
            action={
              <AtlasButton href="/encyclopedia" variant="ghost">
                Open Encyclopedia →
              </AtlasButton>
            }
            columns="three"
          >
            {[
              {
                label: "Director",
                title: "Akira Kurosawa",
                href: "/encyclopedia/directors/akira-kurosawa",
              },
              {
                label: "Country",
                title: "Japan",
                href: "/encyclopedia/countries/japan",
              },
              {
                label: "Movement",
                title: "French New Wave",
                href: "/encyclopedia/movements/french-new-wave",
              },
            ].map((item) => (
              <SlimJourneyCard
                key={item.title}
                label={item.label}
                title={item.title}
                description="Open Encyclopedia"
                href={item.href}
              />
            ))}
          </DiscoveryShelf>

          {/* Passport */}
          <DiscoveryShelf
            title="Passport Progress"
            description="Dashboard가 아닌 간결한 요약입니다."
            action={
              <AtlasButton href="/passport" variant="ghost">
                View Passport →
              </AtlasButton>
            }
            columns="two"
          >
            <div className="col-span-full">
              <AtlasCard className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">
                      Passport Summary
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-white">
                      Your cinema map is ready to grow.
                    </h3>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-neutral-400">
                    Passport will later collect stamps, badges, and progress
                    across countries, directors, movements, actors, and awards.
                  </p>
                </div>
              </AtlasCard>
            </div>
          </DiscoveryShelf>

          {/* Recently Added */}
          <DiscoveryShelf
            title="Recently Added"
            description="최근 추가된 Archive 항목입니다."
            action={
              <AtlasButton href="/movies" variant="ghost">
                View Archive →
              </AtlasButton>
            }
            columns="four"
          >
            {recentlyAddedMovies.map((movie) => (
              <MoviePosterCard key={movie.id} movie={movie} />
            ))}
          </DiscoveryShelf>

          <footer className="border-t border-white/10 py-8 text-sm text-neutral-500">
            Cinema Atlas · Archive · Explore · Discovery · Encyclopedia ·
            Journal · Passport
          </footer>
        </div>
      </PageContainer>
    </main>
  );
}

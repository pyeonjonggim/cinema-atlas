import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";
import BaseHero from "@/components/layout/BaseHero";
import CTAGroup from "@/components/layout/CTAGroup";

import AtlasButton from "@/components/ui/AtlasButton";
import AtlasCard from "@/components/ui/AtlasCard";

import DiscoveryShelf from "@/components/discovery/DiscoveryShelf";

const upcomingItems = [
  "Journal",
  "Watchlist",
  "Collections",
  "Ratings",
  "Viewing History",
  "Statistics",
];

export default function MyAtlasPage() {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-8">
          <BaseHero
            eyebrow="My Atlas"
            title="My Atlas"
            subtitle="Your personal cinema map."
            description="내가 본 영화, 남긴 기록, 저장한 컬렉션, 평점과 감상 이력을 모아보는 개인 영화 지도입니다."
          >
            <CTAGroup>
              <AtlasButton href="/explore">Start Exploring →</AtlasButton>
              <AtlasButton href="/passport" variant="secondary">
                Open Passport →
              </AtlasButton>
            </CTAGroup>
          </BaseHero>

          <DiscoveryShelf
            title="Coming Soon"
            description="My Atlas는 앞으로 개인 기록과 컬렉션의 중심 공간이 됩니다."
            columns="three"
          >
            {upcomingItems.map((item) => (
              <AtlasCard key={item}>
                <p className="text-sm text-neutral-500">My Atlas</p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  {item}
                </h2>

                <p className="mt-4 text-sm leading-6 text-neutral-400">
                  This section will grow as Cinema Atlas expands.
                </p>
              </AtlasCard>
            ))}
          </DiscoveryShelf>

          <footer className="border-t border-white/10 py-8 text-sm text-neutral-500">
            Cinema Atlas · My Atlas · Journal · Watchlist · Collections · Ratings
          </footer>
        </div>
      </PageContainer>
    </>
  );
}
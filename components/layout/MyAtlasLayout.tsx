import type { ReactNode } from "react";

import GlobalNavigation from "@/components/navigation/GlobalNavigation";
import PageContainer from "@/components/layout/PageContainer";

type MyAtlasLayoutProps = {
  children: ReactNode;
};

export default function MyAtlasLayout({ children }: MyAtlasLayoutProps) {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6 py-6">{children}</div>
      </PageContainer>
    </>
  );
}

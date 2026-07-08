import type { ReactNode } from "react";

import GlobalNavigation from "../navigation/GlobalNavigation";
import PageContainer from "../layout/PageContainer";

type EncyclopediaDetailTemplateProps = {
  hero: ReactNode;
  quickFacts: ReactNode;
  overview: ReactNode;
  keySections?: ReactNode;
  timeline?: ReactNode;
  relatedEntities?: ReactNode;
  continueJourney: ReactNode;
  footer?: ReactNode;
};

export default function EncyclopediaDetailTemplate({
  hero,
  quickFacts,
  overview,
  keySections,
  timeline,
  relatedEntities,
  continueJourney,
  footer,
}: EncyclopediaDetailTemplateProps) {
  return (
    <>
      <GlobalNavigation />

      <PageContainer size="wide">
        <div className="space-y-6">
          {hero}
          {quickFacts}
          {overview}
          {keySections}
          {timeline}
          {relatedEntities}
          {continueJourney}
          {footer ?? (
            <footer className="border-t border-white/10 py-6">
              <p className="text-sm text-neutral-500">
                Cinema Atlas turns every entity into the beginning of another
                journey.
              </p>
            </footer>
          )}
        </div>
      </PageContainer>
    </>
  );
}

import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import { MicrosoftSubNav } from "@/components/pages/microsoft/MicrosoftSubNav";
import type { MarketingPageContent } from "@/types/marketing-page";

type MicrosoftPageViewProps = {
  content: MarketingPageContent;
  showSubNav?: boolean;
};

/** Microsoft product pages with optional sibling sub-navigation. */
export function MicrosoftPageView({ content, showSubNav = false }: MicrosoftPageViewProps) {
  return (
    <>
      {showSubNav ? <MicrosoftSubNav /> : null}
      <MarketingPageView content={content} />
    </>
  );
}

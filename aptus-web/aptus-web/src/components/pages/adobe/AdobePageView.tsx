import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import { AdobeSubNav } from "@/components/pages/adobe/AdobeSubNav";
import type { MarketingPageContent } from "@/types/marketing-page";

type AdobePageViewProps = {
  content: MarketingPageContent;
  showSubNav?: boolean;
};

/** Adobe hub + product pages with optional sibling sub-navigation. */
export function AdobePageView({ content, showSubNav = false }: AdobePageViewProps) {
  return (
    <>
      {showSubNav ? <AdobeSubNav /> : null}
      <MarketingPageView content={content} />
    </>
  );
}

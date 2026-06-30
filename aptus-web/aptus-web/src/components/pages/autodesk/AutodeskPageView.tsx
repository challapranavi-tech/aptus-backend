import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import { AutodeskSubNav } from "@/components/pages/autodesk/AutodeskSubNav";
import type { MarketingPageContent } from "@/types/marketing-page";

type AutodeskPageViewProps = {
  content: MarketingPageContent;
  showSubNav?: boolean;
};

/** Autodesk product pages with optional sibling sub-navigation. */
export function AutodeskPageView({ content, showSubNav = false }: AutodeskPageViewProps) {
  return (
    <>
      {showSubNav ? <AutodeskSubNav /> : null}
      <MarketingPageView content={content} />
    </>
  );
}

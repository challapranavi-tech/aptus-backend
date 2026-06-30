import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import { OracleSubNav } from "@/components/pages/oracle/OracleSubNav";
import type { MarketingPageContent } from "@/types/marketing-page";

type OraclePageViewProps = {
  content: MarketingPageContent;
  showSubNav?: boolean;
};

/** Oracle product pages with optional sibling sub-navigation. */
export function OraclePageView({ content, showSubNav = false }: OraclePageViewProps) {
  return (
    <>
      {showSubNav ? <OracleSubNav /> : null}
      <MarketingPageView content={content} />
    </>
  );
}

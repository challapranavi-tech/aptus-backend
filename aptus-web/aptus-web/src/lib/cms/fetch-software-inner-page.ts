import { unstable_cache } from "next/cache";
import { getAdobeInnerContent } from "@/lib/cms/adobe-pages-content";
import { getAutodeskInnerContent } from "@/lib/cms/autodesk-pages-content";
import { getMicrosoftInnerContent } from "@/lib/cms/microsoft-pages-content";
import type { SoftwareInnerPageKey } from "@/lib/cms/software-inner-pages-content";
import {
  DEFAULT_SOFTWARE_INNER_PAGE_CONTENT,
  SOFTWARE_INNER_PAGES,
} from "@/lib/cms/software-inner-pages-content";
import { getMarketingPageJsonFieldName } from "@/lib/cms/marketing-page-json";
import { mapOdooToMarketingPageContent } from "@/lib/cms/marketing-page-mapper";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { fetchOdooPageByUrl } from "@/lib/server/odoo/content/pages";
import type { MarketingPageContent } from "@/types/marketing-page";

async function fetchSoftwareInnerPageContentUncached(
  key: SoftwareInnerPageKey,
): Promise<MarketingPageContent> {
  const config = SOFTWARE_INNER_PAGES[key];
  const defaults =
    getAdobeInnerContent(key) ??
    getAutodeskInnerContent(key) ??
    getOracleInnerContent(key) ??
    getMicrosoftInnerContent(key) ??
    DEFAULT_SOFTWARE_INNER_PAGE_CONTENT[key];

  try {
    const page = await fetchOdooPageByUrl(
      config.odooUrl,
      getMarketingPageJsonFieldName(),
      config.odooPageId > 0 ? config.odooPageId : undefined,
    );
    return mapOdooToMarketingPageContent(page, defaults);
  } catch {
    return defaults;
  }
}

export function fetchSoftwareInnerPageContent(
  key: SoftwareInnerPageKey,
): Promise<MarketingPageContent> {
  const config = SOFTWARE_INNER_PAGES[key];
  const revalidate = getCmsRevalidateSec();

  if (revalidate === 0) {
    return fetchSoftwareInnerPageContentUncached(key);
  }

  return unstable_cache(
    () => fetchSoftwareInnerPageContentUncached(key),
    [`software-inner-page-content-${key}`],
    {
      revalidate,
      tags: [`cms:page:${config.odooUrl}`, `cms:software-inner:${key}`],
    },
  )();
}

import { unstable_cache } from "next/cache";
import { getAdobeHubContent, getAdobeInnerContent } from "@/lib/cms/adobe-pages-content";
import type { SoftwareCategoryKey } from "@/lib/cms/software-pages-content";
import {
  DEFAULT_SOFTWARE_CATEGORY_CONTENT,
  SOFTWARE_CATEGORIES,
} from "@/lib/cms/software-pages-content";
import { getMarketingPageJsonFieldName } from "@/lib/cms/marketing-page-json";
import { mapOdooToMarketingPageContent } from "@/lib/cms/marketing-page-mapper";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { fetchOdooPageByUrl } from "@/lib/server/odoo/content/pages";
import type { MarketingPageContent } from "@/types/marketing-page";

async function fetchSoftwareCategoryContentUncached(
  key: SoftwareCategoryKey,
): Promise<MarketingPageContent> {
  const config = SOFTWARE_CATEGORIES[key];
  const defaults =
    key === "adobe" ? getAdobeHubContent() : DEFAULT_SOFTWARE_CATEGORY_CONTENT[key];

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

export function fetchSoftwareCategoryContent(
  key: SoftwareCategoryKey,
): Promise<MarketingPageContent> {
  const config = SOFTWARE_CATEGORIES[key];
  const revalidate = getCmsRevalidateSec();

  if (revalidate === 0) {
    return fetchSoftwareCategoryContentUncached(key);
  }

  return unstable_cache(
    () => fetchSoftwareCategoryContentUncached(key),
    [`software-category-content-${key}`],
    {
      revalidate,
      tags: [`cms:page:${config.odooUrl}`, `cms:software-category:${key}`],
    },
  )();
}

/** @deprecated Use fetchSoftwareCategoryContent */
export function fetchSoftwarePageContent(key: SoftwareCategoryKey): Promise<MarketingPageContent> {
  return fetchSoftwareCategoryContent(key);
}

import { unstable_cache } from "next/cache";
import type { AboutPageKey } from "@/lib/cms/about-pages-content";
import {
  ABOUT_PAGES,
  DEFAULT_ABOUT_PAGE_CONTENT,
} from "@/lib/cms/about-pages-content";
import { getMarketingPageJsonFieldName } from "@/lib/cms/marketing-page-json";
import { mapOdooToMarketingPageContent } from "@/lib/cms/marketing-page-mapper";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { fetchOdooPageByUrl } from "@/lib/server/odoo/content/pages";
import type { MarketingPageContent } from "@/types/marketing-page";

async function fetchAboutPageContentUncached(key: AboutPageKey): Promise<MarketingPageContent> {
  const config = ABOUT_PAGES[key];
  const defaults = DEFAULT_ABOUT_PAGE_CONTENT[key];

  try {
    const page = await fetchOdooPageByUrl(
      config.odooUrl,
      getMarketingPageJsonFieldName(),
      config.odooPageId,
    );
    return mapOdooToMarketingPageContent(page, defaults);
  } catch {
    return defaults;
  }
}

export function fetchAboutPageContent(key: AboutPageKey): Promise<MarketingPageContent> {
  const config = ABOUT_PAGES[key];
  const revalidate = getCmsRevalidateSec();

  if (revalidate === 0) {
    return fetchAboutPageContentUncached(key);
  }

  return unstable_cache(
    () => fetchAboutPageContentUncached(key),
    [`about-page-content-${key}`],
    {
      revalidate,
      tags: [`cms:page:${config.odooUrl}`, `cms:about:${key}`],
    },
  )();
}

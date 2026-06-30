import { unstable_cache } from "next/cache";
import { mapOdooToEtapPageContent } from "@/lib/cms/etap-mapper";
import { getEtapJsonFieldName } from "@/lib/cms/etap-json";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { SOFTWARE_INNER_PAGES } from "@/lib/cms/software-inner-pages-content";
import { fetchOdooPageByUrl } from "@/lib/server/odoo/content/pages";
import type { EtapPageContent } from "@/types/etap-page";

function getEtapOdooPageId(): number | undefined {
  const fromEnv = process.env.ODOO_CMS_ETAP_PAGE_ID?.trim();
  if (fromEnv) {
    const id = Number(fromEnv);
    if (Number.isFinite(id) && id > 0) return id;
  }
  const configId = SOFTWARE_INNER_PAGES.etap.odooPageId;
  return configId > 0 ? configId : undefined;
}

async function fetchEtapPageContentUncached(): Promise<EtapPageContent> {
  const config = SOFTWARE_INNER_PAGES.etap;

  try {
    const page = await fetchOdooPageByUrl(
      config.odooUrl,
      getEtapJsonFieldName(),
      getEtapOdooPageId(),
    );
    return mapOdooToEtapPageContent(page);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[etap-cms] Odoo fetch failed — using defaults", error);
    }
    return mapOdooToEtapPageContent(null);
  }
}

/** ETAP page CMS content from Odoo `website.page` + `x_etap_sections_json`. */
export function fetchEtapPageContent(): Promise<EtapPageContent> {
  const config = SOFTWARE_INNER_PAGES.etap;
  const revalidate = getCmsRevalidateSec();

  if (revalidate === 0) {
    return fetchEtapPageContentUncached();
  }

  return unstable_cache(fetchEtapPageContentUncached, ["etap-page-content"], {
    revalidate,
    tags: [`cms:page:${config.odooUrl}`, "cms:etap-page", "etap-page-content"],
  })();
}

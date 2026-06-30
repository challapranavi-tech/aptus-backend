import { unstable_cache } from "next/cache";
import { getCmsRevalidateSec } from "@/lib/cms/revalidate";
import { MAIN_PAGES } from "@/lib/cms/main-pages";
import { fetchOdooHomePage, fetchOdooPageByUrl } from "@/lib/server/odoo/content/pages";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import type { ElvPageContent } from "@/types/elv-page";
import type { HomePageContent } from "@/types/sections";
import type { SoftwarePageContent } from "@/types/software-page";
import { mapOdooToHomePageContent, mapStaticHomePageContent } from "./cms-mapper";
import { getCaseStudiesJsonFieldName } from "./case-studies-json";
import { mapOdooToCaseStudiesPageContent, mapStaticCaseStudiesPageContent } from "./case-studies-mapper";
import { getElvJsonFieldName } from "./elv-json";
import { mapOdooToElvPageContent, mapStaticElvPageContent } from "./elv-mapper";
import { getSoftwareJsonFieldName } from "./software-json";
import { mapOdooToSoftwarePageContent, mapStaticSoftwarePageContent } from "./software-mapper";

async function fetchHomePageContentUncached(): Promise<HomePageContent> {
  try {
    const page = await fetchOdooHomePage();
    return mapOdooToHomePageContent(page);
  } catch {
    return mapStaticHomePageContent();
  }
}

/** Server-side homepage content for React section composition. */
export async function fetchHomePageContent(): Promise<HomePageContent> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) {
    return fetchHomePageContentUncached();
  }

  return unstable_cache(fetchHomePageContentUncached, ["homepage-content"], {
    revalidate,
    tags: ["cms:home", "cms:homepage-sections"],
  })();
}

async function fetchElvPageContentUncached(): Promise<ElvPageContent> {
  try {
    const page = await fetchOdooPageByUrl(MAIN_PAGES.elvSolutions.odooUrl, getElvJsonFieldName());
    return mapOdooToElvPageContent(page);
  } catch {
    return mapStaticElvPageContent();
  }
}

/** Server-side ELV page content for React section composition. */
export async function fetchElvPageContent(): Promise<ElvPageContent> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) {
    return fetchElvPageContentUncached();
  }

  return unstable_cache(fetchElvPageContentUncached, ["elv-page-content"], {
    revalidate,
    tags: ["cms:page:/elv-solutions", "cms:elv-sections"],
  })();
}

async function fetchSoftwarePageContentUncached(): Promise<SoftwarePageContent> {
  try {
    const page = await fetchOdooPageByUrl(
      MAIN_PAGES.software.odooUrl,
      getSoftwareJsonFieldName(),
    );
    return mapOdooToSoftwarePageContent(page);
  } catch {
    return mapStaticSoftwarePageContent();
  }
}

/** Server-side Software page content for React section composition. */
export async function fetchSoftwarePageContent(): Promise<SoftwarePageContent> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) {
    return fetchSoftwarePageContentUncached();
  }

  return unstable_cache(fetchSoftwarePageContentUncached, ["software-page-content"], {
    revalidate,
    tags: ["cms:page:/software-solutions", "cms:software-sections"],
  })();
}

async function fetchCaseStudiesPageContentUncached(): Promise<CaseStudiesPageContent> {
  try {
    const page = await fetchOdooPageByUrl(
      MAIN_PAGES.caseStudies.odooUrl,
      getCaseStudiesJsonFieldName(),
    );
    return mapOdooToCaseStudiesPageContent(page);
  } catch {
    return mapStaticCaseStudiesPageContent();
  }
}

/** Server-side Case Studies page content for React section composition. */
export async function fetchCaseStudiesPageContent(): Promise<CaseStudiesPageContent> {
  const revalidate = getCmsRevalidateSec();
  if (revalidate === 0) {
    return fetchCaseStudiesPageContentUncached();
  }

  return unstable_cache(fetchCaseStudiesPageContentUncached, ["case-studies-page-content"], {
    revalidate,
    tags: ["cms:page:/aptus-case-studies", "cms:case-studies-sections"],
  })();
}

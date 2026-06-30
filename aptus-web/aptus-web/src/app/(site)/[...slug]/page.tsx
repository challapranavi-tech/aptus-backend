import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageBody } from "@/components/cms/CmsPageBody";
import { AdobePageView } from "@/components/pages/adobe/AdobePageView";
import { AutodeskPageView } from "@/components/pages/autodesk/AutodeskPageView";
import { MicrosoftPageView } from "@/components/pages/microsoft/MicrosoftPageView";
import { OraclePageView } from "@/components/pages/oracle/OraclePageView";
import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import { getAboutPagePaths } from "@/lib/cms/about-pages-content";
import { AUTODESK_INNER_PATHS } from "@/lib/cms/autodesk-inner-registry";
import { MICROSOFT_INNER_PATHS } from "@/lib/cms/microsoft-inner-registry";
import { ORACLE_INNER_PATHS } from "@/lib/cms/oracle-inner-registry";
import { fetchSoftwareCategoryContent } from "@/lib/cms/fetch-software-page";
import { fetchSoftwareInnerPageContent } from "@/lib/cms/fetch-software-inner-page";
import {
  getSoftwareInnerPageKeyBySlug,
  isAdobeInnerPageKey,
  isAutodeskInnerPageKey,
  isOracleInnerPageKey,
  isMicrosoftInnerPageKey,
  SOFTWARE_INNER_PAGES,
} from "@/lib/cms/software-inner-pages-content";
import {
  getSoftwareCategoryKeyBySlug,
  SOFTWARE_CATEGORIES,
} from "@/lib/cms/software-pages-content";
import { pageUrlToSlug, slugToPageUrl } from "@/lib/cms/url";
import { MAIN_PAGES } from "@/lib/cms/main-pages";
import { SITE } from "@/lib/constants";
import { fetchOdooPageByUrl, listOdooCmsPageUrls } from "@/lib/server/odoo/content/pages";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

/** Paths with dedicated Next.js routes under app/(site) — skip catch-all static params. */
const DEDICATED_PAGE_PATHS = new Set([
  ...Object.values(MAIN_PAGES).map((page) => page.path.replace(/^\//, "")),
  ...getAboutPagePaths(),
  "etap_new",
]);

export async function generateStaticParams() {
  const urls = await listOdooCmsPageUrls();

  const params: { slug: string[] }[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    const slug = pageUrlToSlug(url);
    if (!slug) continue;
    const path = slug.join("/");
    if (DEDICATED_PAGE_PATHS.has(path)) continue;
    if (seen.has(path)) continue;
    seen.add(path);
    params.push({ slug });
  }

  for (const slug of AUTODESK_INNER_PATHS) {
    if (!slug || DEDICATED_PAGE_PATHS.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    params.push({ slug: [slug] });
  }

  for (const slug of ORACLE_INNER_PATHS) {
    if (!slug || DEDICATED_PAGE_PATHS.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    params.push({ slug: [slug] });
  }

  for (const slug of MICROSOFT_INNER_PATHS) {
    if (!slug || DEDICATED_PAGE_PATHS.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    params.push({ slug: [slug] });
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const softwareKey = getSoftwareCategoryKeyBySlug(slugPath);

  if (softwareKey) {
    const content = await fetchSoftwareCategoryContent(softwareKey);
    const config = SOFTWARE_CATEGORIES[softwareKey];
    return {
      title: content.metaTitle ?? config.title,
      description: content.metaDescription ?? config.description,
    };
  }

  const innerKey = getSoftwareInnerPageKeyBySlug(slugPath);

  if (innerKey) {
    const content = await fetchSoftwareInnerPageContent(innerKey);
    const config = SOFTWARE_INNER_PAGES[innerKey];
    return {
      title: content.metaTitle ?? config.title,
      description: content.metaDescription ?? config.description,
    };
  }

  const page = await fetchOdooPageByUrl(slugToPageUrl(slug));

  if (!page) {
    return { title: SITE.title };
  }

  return {
    title: page.metaTitle ?? `${page.name} | ${SITE.name}`,
    description: page.metaDescription ?? SITE.description,
  };
}

export default async function CmsSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const softwareKey = getSoftwareCategoryKeyBySlug(slugPath);

  if (softwareKey) {
    const content = await fetchSoftwareCategoryContent(softwareKey);
    if (softwareKey === "adobe") {
      return <AdobePageView content={content} />;
    }
    if (softwareKey === "oracle") {
      return <OraclePageView content={content} />;
    }
    if (softwareKey === "microsoft") {
      return <MicrosoftPageView content={content} />;
    }
    return <MarketingPageView content={content} />;
  }

  const innerKey = getSoftwareInnerPageKeyBySlug(slugPath);

  if (innerKey) {
    const content = await fetchSoftwareInnerPageContent(innerKey);
    if (isAdobeInnerPageKey(innerKey)) {
      return <AdobePageView content={content} showSubNav />;
    }
    if (isAutodeskInnerPageKey(innerKey)) {
      return <AutodeskPageView content={content} showSubNav />;
    }
    if (isOracleInnerPageKey(innerKey)) {
      return <OraclePageView content={content} showSubNav />;
    }
    if (isMicrosoftInnerPageKey(innerKey)) {
      return <MicrosoftPageView content={content} showSubNav />;
    }
    return <MarketingPageView content={content} />;
  }

  const page = await fetchOdooPageByUrl(slugToPageUrl(slug));

  if (!page?.html) {
    notFound();
  }

  return <CmsPageBody html={page.html} />;
}

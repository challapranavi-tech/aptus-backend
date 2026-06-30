import type { Metadata } from "next";
import { MarketingPageView } from "@/components/pages/shared/MarketingPageView";
import type { AboutPageKey } from "@/lib/cms/about-pages-content";
import { ABOUT_PAGES } from "@/lib/cms/about-pages-content";
import { fetchAboutPageContent } from "@/lib/cms/fetch-about-page";

export function createAboutPageHandlers(key: AboutPageKey) {
  async function generateMetadata(): Promise<Metadata> {
    const content = await fetchAboutPageContent(key);
    const config = ABOUT_PAGES[key];
    return {
      title: content.metaTitle ?? config.title,
      description: content.metaDescription ?? config.description,
    };
  }

  async function AboutMarketingPage() {
    const content = await fetchAboutPageContent(key);
    return <MarketingPageView content={content} />;
  }

  return { generateMetadata, default: AboutMarketingPage };
}

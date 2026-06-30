import type { Metadata } from "next";
import { HomePageView } from "@/components/sections/HomePageView";
import { fetchHomePageContent } from "@/lib/cms/content-fetcher";
import { SITE } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchHomePageContent();

  return {
    title: content.metaTitle ?? SITE.title,
    description: content.metaDescription ?? SITE.description,
  };
}

export default async function HomePage() {
  const content = await fetchHomePageContent();
  return <HomePageView content={content} />;
}

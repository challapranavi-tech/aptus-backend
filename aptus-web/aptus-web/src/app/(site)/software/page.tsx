import type { Metadata } from "next";
import { SoftwarePageView } from "@/components/pages/software/SoftwarePageView";
import { fetchSoftwarePageContent } from "@/lib/cms/content-fetcher";
import { MAIN_PAGES } from "@/lib/cms/main-pages";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchSoftwarePageContent();

  return {
    title: content.metaTitle ?? MAIN_PAGES.software.title,
    description: content.metaDescription ?? MAIN_PAGES.software.description,
  };
}

export default async function SoftwareRoutePage() {
  const content = await fetchSoftwarePageContent();
  return <SoftwarePageView content={content} />;
}

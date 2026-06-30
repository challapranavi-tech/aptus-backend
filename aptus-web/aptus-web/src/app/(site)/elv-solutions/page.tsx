import type { Metadata } from "next";
import { ElvPageView } from "@/components/pages/elv-solutions/ElvPageView";
import { fetchElvPageContent } from "@/lib/cms/content-fetcher";
import { MAIN_PAGES } from "@/lib/cms/main-pages";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchElvPageContent();

  return {
    title: content.metaTitle ?? MAIN_PAGES.elvSolutions.title,
    description: content.metaDescription ?? MAIN_PAGES.elvSolutions.description,
  };
}

export default async function ElvSolutionsPage() {
  const content = await fetchElvPageContent();
  return <ElvPageView content={content} />;
}

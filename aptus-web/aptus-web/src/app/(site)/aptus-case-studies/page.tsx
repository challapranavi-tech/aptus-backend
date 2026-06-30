import type { Metadata } from "next";
import { CaseStudiesPageView } from "@/components/pages/aptus-case-studies/CaseStudiesPageView";
import { fetchCaseStudiesPageContent } from "@/lib/cms/content-fetcher";
import { MAIN_PAGES } from "@/lib/cms/main-pages";
import "@/styles/aptus.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = await fetchCaseStudiesPageContent();

  return {
    title: content.metaTitle ?? MAIN_PAGES.caseStudies.title,
    description: content.metaDescription ?? MAIN_PAGES.caseStudies.description,
  };
}

export default async function AptusCaseStudiesPage() {
  const content = await fetchCaseStudiesPageContent();
  return <CaseStudiesPageView content={content} />;
}

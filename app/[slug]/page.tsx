import { CaseStudiesPageView } from "@/components/pages/CaseStudiesPageView";
import { EtapStackedSections, SectionRenderer } from "@/components/sections";
import { Loading } from "@/components/ui";
import { getElvPageScope } from "@/data/elv-page-scope";
import { getSoftwarePageScope } from "@/data/software-page-scope";
import { getAllPageSlugs, getPageBySlug } from "@/data";
import { loadCaseStudiesPageContent } from "@/lib/case-studies-page-content";
import { cn, buildPageMetadata, formatSlug } from "@/lib/utils";
import "@/styles/case-studies-pages.css";
import "@/styles/pages/team.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(formatSlug(slug));

  if (!page) {
    return { title: slug };
  }

  return buildPageMetadata(page);
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const normalized = formatSlug(slug);
  const page = await getPageBySlug(normalized);

  if (!page) {
    notFound();
  }

  if (normalized === "aptus-case-studies") {
    const caseStudiesContent = loadCaseStudiesPageContent();
    if (!caseStudiesContent) {
      notFound();
    }

    return (
      <Suspense fallback={<Loading fullScreen />}>
        <div className="aptus-case-studies-page">
          <CaseStudiesPageView content={caseStudiesContent} />
        </div>
      </Suspense>
    );
  }

  const softwareScope = getSoftwarePageScope(normalized);
  const elvScope = getElvPageScope(normalized);

  return (
    <Suspense fallback={<Loading fullScreen />}>
      <div
        className={cn(
          softwareScope?.wrapperClass,
          elvScope?.wrapperClass,
          softwareScope?.family === "autodesk" && "aptus-autodesk-page",
          softwareScope?.isInner && softwareScope.family === "autodesk" && `aptus-autodesk-page--${normalized}`,
        )}
      >
        {normalized === "etap" ? (
          <EtapStackedSections sections={page.sections} />
        ) : (
          <SectionRenderer sections={page.sections} />
        )}
      </div>
    </Suspense>
  );
}

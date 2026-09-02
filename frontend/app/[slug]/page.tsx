import { CaseStudiesPageView } from "@/components/pages/CaseStudiesPageView";
import { SectionRenderer, SoftwareStackedSections } from "@/components/sections";
import { Loading } from "@/components/ui";
import { getElvPageScope } from "@/data/elv-page-scope";
import { isAutodeskHiddenSlug } from "@/data/autodesk-subnav";
import { getSoftwarePageScope, usesStackedSoftwareLayout } from "@/data/software-page-scope";
import { getAllPageSlugs, getPageBySlug, loadCaseStudiesPageContent } from "@/data";
import { localizePage } from "@/lib/localize-page";
import { getRequestLocale } from "@/lib/request-locale";
import { cn, buildPageMetadata, formatSlug } from "@/lib/utils";
import "@/styles/case-studies-pages.css";
import "@/styles/pages/team.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

function isCaseStudiesSlug(slug: string): boolean {
  return slug === "customer-stories" || slug === "aptus-case-studies";
}

export async function generateStaticParams() {
  const slugs = (await getAllPageSlugs()).filter(
    // /autodesk and /adobe are dedicated App Router replicas, not CMS [slug].
    (slug) => slug !== "autodesk" && slug !== "adobe" && slug !== "software-solutions",
  );

  // Warm + gate: only prerender pages that respond before the CMS timeout.
  // One slow Odoo page (e.g. /spectronova) must not abort the whole Vercel build.
  // Skipped slugs stay live via dynamicParams on first request.
  // ponytail: serial probes — parallel stampedes Odoo and creates more timeouts.
  const out: { slug: string }[] = [{ slug: "customer-stories" }];
  for (const slug of slugs) {
    if (isCaseStudiesSlug(slug)) continue;
    try {
      if (await getPageBySlug(slug)) out.push({ slug });
    } catch (err) {
      console.error(`[cms] skip static generation for /${slug}:`, err);
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = formatSlug(slug);
  if (isCaseStudiesSlug(normalized)) {
    return { title: "Solutions in Action" };
  }
  try {
    const page = await getPageBySlug(normalized);
    if (!page) return { title: slug };
    return buildPageMetadata(page);
  } catch {
    return { title: slug };
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const normalized = formatSlug(slug);

  if (isAutodeskHiddenSlug(normalized)) {
    notFound();
  }

  if (isCaseStudiesSlug(normalized)) {
    const caseStudiesContent = await loadCaseStudiesPageContent();
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

  let page;
  try {
    const locale = await getRequestLocale();
    const raw = await getPageBySlug(normalized);
    page = raw ? await localizePage(raw, locale) : null;
  } catch (err) {
    console.error(`[cms] /${normalized} load failed:`, err);
    // Build safety net if a slug still entered the static set and then timed out.
    // Runtime: rethrow so we do not bake a sticky fake 404 over a transient Odoo blip.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      notFound();
    }
    throw err;
  }

  if (!page) {
    notFound();
  }

  const softwareScope = getSoftwarePageScope(normalized);
  const elvScope = getElvPageScope(normalized);

  return (
    <Suspense fallback={<Loading fullScreen />}>
      <div
        className={cn(
          softwareScope?.wrapperClass,
          elvScope?.wrapperClass,
          (softwareScope?.family === "autodesk" || softwareScope?.isInner) && "aptus-autodesk-page",
          softwareScope?.isInner && `aptus-autodesk-page--${normalized}`,
          normalized === "our-story" && "page-our-story",
        )}
      >
        {usesStackedSoftwareLayout(normalized) ? (
          <SoftwareStackedSections sections={page.sections} />
        ) : (
          <SectionRenderer sections={page.sections} />
        )}
      </div>
    </Suspense>
  );
}

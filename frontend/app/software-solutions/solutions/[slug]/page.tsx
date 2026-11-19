import { SoftwareCatalogPanel } from "@/components/software/SoftwareCatalogPanel";
import { softwareSolutionBySlug, SOFTWARE_SOLUTION_PAGES } from "@/data/software-solution-pages";

const PRODUCT_NAMES = [
  "Adobe Creative Cloud",
  "Adobe Acrobat Pro",
  "Civil 3D",
  "Navisworks",
  "Premiere Pro",
  "RIB CostX",
  "Chaos Corona",
  "PlanSwift",
  "Palo Alto Networks",
  "Broadcom Symantec",
  "Kaspersky",
  "Fortinet",
  "Quorum",
  "SAP2000",
  "CSiBridge",
  "PROKON",
  "ETABS",
  "SAFE",
  "CYPE",
  "CSI",
  "Power BI",
  "SQL Server",
  "Illustrator",
  "Photoshop",
  "AutoCAD",
  "Revit",
  "Inventor",
  "Cubicost",
  "Enscape",
  "Lumion",
].sort((a, b) => b.length - a.length);

function withProductNames(text: string) {
  const pattern = new RegExp(`(${PRODUCT_NAMES.join("|")})`, "g");
  return text.split(pattern).map((part, index) =>
    PRODUCT_NAMES.includes(part) ? (
      <strong key={index} data-no-translate="">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
import { withArabicMeta } from "@/lib/arabic-meta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "@/styles/software-catalog.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SOFTWARE_SOLUTION_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = softwareSolutionBySlug(slug);
  if (!page) return withArabicMeta({ title: "Solution not found" });
  return withArabicMeta({
    title: page.label,
    description: page.description,
  });
}

export default async function SoftwareSolutionPage({ params }: PageProps) {
  const { slug } = await params;
  const page = softwareSolutionBySlug(slug);
  if (!page) notFound();

  return (
    <div className="aptus-elv-page">
      <section className="aptus-software-page-banner" data-section="software-page-banner">
        <div className="aptus-live-container">
          <div className="aptus-software-page-banner__inner">
            <h1 className="aptus-software-page-banner__title">{page.label}</h1>
          </div>
        </div>
      </section>
      <section className="aptus-software-solution-copy" data-section="software-solution-copy">
        <div className="aptus-live-container">
          <p>{page.description}</p>
          {page.sections?.map((section) => [
            <h2 key={section.heading}>{section.heading}</h2>,
            <p key={`${section.heading}-body`}>{withProductNames(section.body)}</p>,
          ])}
          {page.closing ? <p>{page.closing}</p> : null}
          {page.sections ? null : page.points.map((point) => <p key={point}>{point}</p>)}
        </div>
      </section>
      <Suspense fallback={null}>
        <SoftwareCatalogPanel solutionType={page.label} />
      </Suspense>
    </div>
  );
}

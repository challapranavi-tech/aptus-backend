import { Suspense } from "react";
import { SoftwareCatalogPanel } from "@/components/software/SoftwareCatalogPanel";
import { SoftwareSolutionsHero } from "@/components/software/SoftwareSolutionsHero";
import { CTA } from "@/components/sections/CTA";
import type { Metadata } from "next";
import "@/styles/software-catalog.css";
import "@/styles/software-pages.css";

export const metadata: Metadata = {
  title: "Software Solutions",
  description:
    "Browse premium software from Autodesk, Adobe, Microsoft, Oracle, and more. Purchase online or request a quote from Aptus Infotech.",
};

function CatalogFallback() {
  return (
    <section className="aptus-software-catalog" aria-busy="true">
      <div className="aptus-software-catalog__inner">
        <p className="aptus-software-catalog__subtitle">Loading products…</p>
      </div>
    </section>
  );
}

export default function SoftwareSolutionsPage() {
  return (
    <main className="aptus-software-page aptus-software-catalog-page">
      <SoftwareSolutionsHero />
      <div id="software-catalog">
        <Suspense fallback={<CatalogFallback />}>
          <SoftwareCatalogPanel />
        </Suspense>
      </div>
      <CTA
        data={{
          type: "cta",
          heading: "Have questions? We can help",
          showForm: true,
          submitLabel: "Submit Now",
          formVariant: "software-quote",
          layout: "light",
          category: "software",
        }}
      />
    </main>
  );
}

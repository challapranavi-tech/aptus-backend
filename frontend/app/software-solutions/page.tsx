import { Suspense } from "react";
import { SoftwareCatalogPanel } from "@/components/software/SoftwareCatalogPanel";
import { SoftwareCatalogHashScroll } from "@/components/software/SoftwareCatalogHashScroll";
import { SoftwareSolutionsHero } from "@/components/software/SoftwareSolutionsHero";
import { Features } from "@/components/sections/Features";
import { LogoGrid } from "@/components/sections/LogoGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import {
  SOFTWARE_OUR_PROCESS,
  SOFTWARE_PARTNERSHIPS,
  SOFTWARE_TESTIMONIALS,
} from "@/data/software-solutions-page";
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
      <Suspense fallback={null}>
        <SoftwareCatalogHashScroll />
      </Suspense>
      <SoftwareSolutionsHero />
      <LogoGrid data={SOFTWARE_PARTNERSHIPS} />
      <Suspense fallback={<CatalogFallback />}>
        <SoftwareCatalogPanel />
      </Suspense>
      <Features data={SOFTWARE_OUR_PROCESS} />
      <Testimonials data={SOFTWARE_TESTIMONIALS} marquee />
    </main>
  );
}

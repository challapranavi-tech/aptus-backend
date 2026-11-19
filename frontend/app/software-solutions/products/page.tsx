import { T } from "@/components/i18n/T";
import { Suspense } from "react";
import { SoftwareCatalogPanel } from "@/components/software/SoftwareCatalogPanel";
import { SoftwareCatalogHashScroll } from "@/components/software/SoftwareCatalogHashScroll";
import { withArabicMeta } from "@/lib/arabic-meta";
import type { Metadata } from "next";
import "@/styles/software-catalog.css";
import "@/styles/software-pages.css";

export function generateMetadata(): Promise<Metadata> {
  return withArabicMeta({
    title: "Browse Software Products",
    description:
      "Explore premium software from Autodesk, Adobe, Microsoft, Oracle, and more. Purchase online or request a quote from Aptus Infotech.",
  });
}

function CatalogFallback() {
  return (
    <section className="aptus-software-catalog" aria-busy="true">
      <div className="aptus-software-catalog__inner">
        <p className="aptus-software-catalog__subtitle">
          <T text="Loading products…" />
        </p>
      </div>
    </section>
  );
}

export default function SoftwareProductsPage() {
  return (
    <main className="aptus-software-page aptus-software-catalog-page aptus-software-products-page">
      <Suspense fallback={null}>
        <SoftwareCatalogHashScroll />
      </Suspense>
      <Suspense fallback={<CatalogFallback />}>
        <SoftwareCatalogPanel />
      </Suspense>
    </main>
  );
}

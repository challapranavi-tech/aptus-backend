import { ProductDetailPanel } from "@/components/portal/ProductDetailPanel";
import { allFullCatalogProductSlugs, lookupFullCatalogProductBySlug } from "@/data/software-full-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/styles/software-catalog.css";
import "@/styles/customer-dashboard.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allFullCatalogProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = lookupFullCatalogProductBySlug(slug);
  if (!found) return { title: "Product not found" };
  return {
    title: found.product.name,
    description: `${found.product.name} — ${found.brand.label} licenses from Aptus Infotech.`,
  };
}

export default async function SoftwareProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const found = lookupFullCatalogProductBySlug(slug);
  if (!found) notFound();

  return (
    <main className="aptus-software-catalog-page aptus-software-product-detail-page">
      <div className="aptus-software-product-detail-page__shell">
        <ProductDetailPanel product={found.product} category={found.brand} />
      </div>
    </main>
  );
}

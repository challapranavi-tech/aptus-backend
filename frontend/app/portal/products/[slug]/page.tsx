import { ProductDetailPanel } from "@/components/portal/ProductDetailPanel";
import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import {
  allPurchaseProductSlugs,
  lookupPurchaseProductBySlug,
} from "@/data/software-purchase-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPurchaseProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = lookupPurchaseProductBySlug(slug);
  if (!found) return { title: "Product not found" };
  return {
    title: `${found.product.name} | Aptus Customer Portal`,
    description: `${found.product.name} — ${found.category.label} licenses from Aptus Infotech.`,
  };
}

export default async function PortalProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const found = lookupPurchaseProductBySlug(slug);
  if (!found) notFound();

  return (
    <PortalDashboardShell section="products">
      <ProductDetailPanel product={found.product} category={found.category} />
    </PortalDashboardShell>
  );
}

import { BrandVisibilityPageView } from "@/components/adobe/BrandVisibilityPageView";
import { withArabicMeta } from "@/lib/arabic-meta";
import type { Metadata } from "next";

export function generateMetadata(): Promise<Metadata> {
  return withArabicMeta({
    title: "Adobe Brand Visibility | AI Search Optimization",
    description:
      "Transform AI signals into real business impact with Adobe Brand Visibility — measure brand presence across AI answers, improve GEO, and prove revenue impact.",
  });
}

/** Replica of business.adobe.com/products/brand-visibility.html */
export default function AdobeBrandVisibilityPage() {
  return <BrandVisibilityPageView />;
}

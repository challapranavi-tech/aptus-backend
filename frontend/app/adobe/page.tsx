import { AdobePageView } from "@/components/adobe";
import { withArabicMeta } from "@/lib/arabic-meta";
import type { Metadata } from "next";

export function generateMetadata(): Promise<Metadata> {
  return withArabicMeta({
    title: "Adobe",
    description:
      "Adobe creative, marketing, and document solutions — Creative Cloud, Acrobat, Firefly, and more. Aptus Infotech is your trusted Adobe partner.",
  });
}

/** Dedicated /adobe route — Aptus Header/Footer from root layout. */
export default function AdobePage() {
  return <AdobePageView />;
}

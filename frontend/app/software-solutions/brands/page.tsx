import { SoftwareBrandsExplorer } from "@/components/software/SoftwareBrandsExplorer";
import { withArabicMeta } from "@/lib/arabic-meta";
import type { Metadata } from "next";
import "@/styles/software-catalog.css";
import "@/styles/software-pages.css";

export function generateMetadata(): Promise<Metadata> {
  return withArabicMeta({
    title: "Explore Software Brands",
    description:
      "Browse Aptus Infotech software brands — Autodesk, Adobe, Microsoft, Oracle, and more — then open the catalogue with your filters applied.",
  });
}

export default function SoftwareBrandsPage() {
  return (
    <main className="aptus-software-page aptus-software-catalog-page aptus-software-brands-page">
      <SoftwareBrandsExplorer />
    </main>
  );
}

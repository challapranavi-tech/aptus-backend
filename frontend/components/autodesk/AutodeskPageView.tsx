import { HeroSection } from "./HeroSection";
import { HidePromoCtas } from "./HidePromoCtas";
import { IndustryExplore } from "./IndustryExplore";
import { ProductGrid } from "./ProductGrid";
import { SolutionHighlights } from "./SolutionHighlights";
import { SolutionsSection } from "./SolutionsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import shared from "@/styles/autodesk/autodesk.module.css";

/** Autodesk.com homepage replica — Aptus chrome comes from root layout. */
export function AutodeskPageView() {
  return (
    <div className={shared.adRoot} data-ad-root>
      <HidePromoCtas />
      <HeroSection />
      <IndustryExplore />
      <ProductGrid />
      <SolutionHighlights />
      <TestimonialsSection />
      <SolutionsSection />
    </div>
  );
}

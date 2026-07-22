import styles from "@/styles/adobe/adobe.module.css";
import { CTASection } from "./CTASection";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { NewsSection } from "./NewsSection";
import { ProductGridSection } from "./ProductGridSection";
import { ProductShowcase } from "./ProductShowcase";
import { TestimonialsSection } from "./TestimonialsSection";

/**
 * Matches adobe.com stack:
 * hero (parallax-move-up-fast) → white product/features → testimonials →
 * news (rounded-corners-bottom) → CTA (parallax-garage-door-reveal) → product grid.
 */
export function AdobePageView() {
  return (
    <div className={styles.adobePage}>
      <HeroSection />

      <section
        className={`${styles.section} ${styles.sectionFlow}`}
        aria-label="Products and features"
      >
        <div className={`${styles.introSection} ${styles.parallaxFadeUp}`}>
          <h2 className={styles.heading2}>Everything you need to make anything.</h2>
          <p className={styles.bodyLg}>
            Whether you&apos;re a student, social influencer, creative professional,
            performance marketer, or global brand, Adobe has the apps you need to make it
            happen.
          </p>
        </div>
        <ProductShowcase />
        <FeaturesSection />
      </section>

      <TestimonialsSection />

      <section
        className={`${styles.section} ${styles.newsPanel} ${styles.gridPad}`}
        aria-label="Adobe News"
      >
        <NewsSection />
      </section>

      <CTASection />

      <div className={`${styles.section} ${styles.sectionFlow}`} style={{ background: "#000" }}>
        <ProductGridSection />
      </div>
    </div>
  );
}

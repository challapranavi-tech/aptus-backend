import styles from "@/styles/adobe/adobe.module.css";
import { CTASection } from "./CTASection";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { NewsSection } from "./NewsSection";
import { ProductGridSection } from "./ProductGridSection";
import { ProductShowcase } from "./ProductShowcase";
import { TestimonialsSection } from "./TestimonialsSection";

/** Adobe.com homepage replica — Aptus chrome comes from root layout. */
export function AdobePageView() {
  return (
    <div className={styles.adobePage}>
      <HeroSection />

      <section style={{ background: "#fff" }}>
        <div className={styles.introSection}>
          <h2 className={styles.heading2}>Everything you need to make anything.</h2>
          <p className={styles.bodyLg}>
            Whether you&apos;re a student, social influencer, creative professional,
            performance marketer, or global brand, Adobe has the apps you need to make it
            happen.
          </p>
        </div>
        <ProductShowcase />
      </section>

      <section style={{ background: "#fff", paddingBottom: "var(--sp-32)" }}>
        <FeaturesSection />
      </section>

      <TestimonialsSection />

      <section style={{ background: "#fff" }}>
        <NewsSection />
      </section>

      <CTASection />
      <ProductGridSection />
    </div>
  );
}

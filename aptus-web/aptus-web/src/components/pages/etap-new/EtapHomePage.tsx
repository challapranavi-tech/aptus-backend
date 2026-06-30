"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DEFAULT_ETAP_HOME_PAGE_DATA, type EtapHomePageData } from "./etap-home-types";
import { EtapHomeDataProvider } from "./EtapHomeDataContext";
import { EtapHomeHeroCarousel } from "./EtapHomeHeroCarousel";
import { EtapHomeIndustries } from "./EtapHomeIndustries";
import { EtapHomeIntro } from "./EtapHomeIntro";
import { EtapHomeLearningBanner } from "./EtapHomeLearningBanner";
import { EtapHomeNavbar } from "./EtapHomeNavbar";
import { EtapHomeNewsSection } from "./EtapHomeNewsSection";
import { EtapHomePricingStrip } from "./EtapHomePricingStrip";
import { EtapHomeProducts } from "./EtapHomeProducts";
import { EtapHomeTestimonials } from "./EtapHomeTestimonials";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type EtapHomePageProps = {
  data?: EtapHomePageData;
};

/** High-fidelity ETAP homepage recreation with Aptus navbar/footer integration. */
export function EtapHomePage({ data = DEFAULT_ETAP_HOME_PAGE_DATA }: EtapHomePageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-gsap-section]").forEach((section) => {
        gsap.fromTo(
          section,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <EtapHomeDataProvider value={data}>
      <div ref={rootRef} className="etap-home">
        <EtapHomeNavbar />
        <div className="etap-home-main">
          <EtapHomeHeroCarousel />
          <EtapHomeIntro />
          <EtapHomePricingStrip />
          <EtapHomeIndustries />
          <EtapHomeProducts />
          <EtapHomeNewsSection />
          <EtapHomeTestimonials />
          <EtapHomeLearningBanner />
        </div>
      </div>
    </EtapHomeDataProvider>
  );
}

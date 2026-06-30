"use client";

import Image from "next/image";
import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomePricingStrip() {
  const { pricing } = useEtapHomeData();

  return (
    <section className="etap-home-pricing" data-gsap-section>
      <div className="ps-container">
        <div className="ps-row">
          <div className="ps-column ps-image-col">
            <Image
              src={pricing.image}
              alt={pricing.imageAlt}
              width={560}
              height={360}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div className="ps-column content-col">
            <h2 className="release-title">{pricing.title}</h2>
            <p>{pricing.description}</p>
            <a href={pricing.ctaHref} target="_blank" rel="noopener noreferrer" className="subscription-button">
              <span className="arrow">→</span>
              {pricing.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomeLearningBanner() {
  const { learning } = useEtapHomeData();

  return (
    <section className="etap-home-learning etap-container" data-gsap-section>
      <div className="enews-banner">
        <div className="enews-content">
          <p className="enews-text">{learning.text}</p>
          <a
            href={learning.ctaHref}
            target={learning.ctaHref.startsWith("/") ? undefined : "_blank"}
            rel={learning.ctaHref.startsWith("/") ? undefined : "noopener noreferrer"}
            className="enews-button"
          >
            {learning.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

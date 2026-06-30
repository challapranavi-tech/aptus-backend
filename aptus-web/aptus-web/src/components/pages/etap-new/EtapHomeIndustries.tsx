"use client";

import { useRef } from "react";
import Image from "next/image";
import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomeIndustries() {
  const { industries, industriesTitle } = useEtapHomeData();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.querySelector(".solutions-item") as HTMLElement | null;
    const itemWidth = item ? item.offsetWidth + 20 : 320;
    el.scrollBy({ left: direction * itemWidth * 3, behavior: "smooth" });
  };

  return (
    <section className="etap-home-industries" data-gsap-section>
      <div className="solutions-header etap-container">
        <h2 className="solutions-title">{industriesTitle}</h2>
        <div className="solutions-controls">
          <button type="button" className="solutions-control-btn solutions-prev" aria-label="Previous" onClick={() => scroll(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="solutions-control-btn solutions-next" aria-label="Next" onClick={() => scroll(1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="#000" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      <div className="solutions-scroll-container etap-container" ref={scrollRef}>
        <div className="solutions-grid">
          {industries.map((item) => (
            <div key={item.title} className="solutions-item">
              <div className="solutions-image">
                <Image src={item.image} alt={item.title} width={300} height={180} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <h6 className="solutions-name">
                <a className="solutions-link" href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h6>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

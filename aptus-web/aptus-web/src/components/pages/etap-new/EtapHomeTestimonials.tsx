"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useEtapHomeData } from "./EtapHomeDataContext";

export function EtapHomeTestimonials() {
  const { testimonials } = useEtapHomeData();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!testimonials.length) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="etap-home-testimonials" data-gsap-section>
      <h1 className="page-top-title">Trusted by</h1>
      <div className="carousel-inner">
        {testimonials.map((t, i) => (
          <blockquote key={t.company} className={`quote-slide${i === active ? " is-active" : ""}`}>
            <div className="quote-row">
              <div className="quote-logo">
                <Image src={t.logo} alt={t.company} width={180} height={80} style={{ maxWidth: "80%", height: "auto" }} />
              </div>
              <div className="quote-body">
                <p>&ldquo;{t.quote}&rdquo;</p>
                <small>{t.company}</small>
              </div>
            </div>
          </blockquote>
        ))}
      </div>
      <ol className="carousel-indicators">
        {testimonials.map((t, i) => (
          <li key={t.company}>
            <button
              type="button"
              className={i === active ? "is-active" : ""}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setActive(i)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

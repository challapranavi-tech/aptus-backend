"use client";

import { Container } from "@/components/ui";
import { useGSAPContext } from "@/hooks/useGSAPContext";
import { gsap } from "@/lib/gsap";
import { resolveCmsImageSrc } from "@/lib/utils";
import type { TestimonialItem, Testimonials as TestimonialsData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface TestimonialsProps {
  data: TestimonialsData;
  /** Dark horizontal marquee (software catalog page). */
  marquee?: boolean;
}

const AVATAR_TONES = ["blue", "teal", "purple", "orange", "navy"] as const;

function authorInitials(name?: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function roleLine(role?: string, company?: string): string | undefined {
  if (role && company) return `${role} · ${company}`;
  return role || company || undefined;
}

export function Testimonials({ data, marquee = false }: TestimonialsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isSoftwareQuotes = data.variant === "software-quotes" && !marquee;
  const isSoftwareQuotesMarquee =
    marquee || data.variant === "software-quotes-marquee";
  const isHomeCards = data.variant === "home-cards";

  useGSAPContext({
    scope: sectionRef,
    dependencies: [data.items?.length, data.variant, marquee],
    setup() {
      if (
        data.variant === "software-quotes" ||
        data.variant === "software-quotes-marquee" ||
        data.variant === "home-cards" ||
        marquee
      ) {
        return;
      }

      const inner = sectionRef.current?.querySelector(".testimonial-inner");
      if (!inner) return;
      gsap.from(inner.children, {
        y: 32,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
    },
  });

  if (!data.items?.length) return null;

  if (isHomeCards) {
    const items = data.items;
    const renderCard = (item: TestimonialItem, index: number, keyPrefix: string) => {
      const meta = roleLine(item.role, item.company);
      const tone = AVATAR_TONES[index % AVATAR_TONES.length];

      return (
        <article key={`${keyPrefix}-${item.id}`} className="home-testimonial-card">
          <div className="home-testimonial-card__stars" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="home-testimonial-card__star" aria-hidden="true">
                ★
              </span>
            ))}
          </div>

          {item.quote && (
            <p className="home-testimonial-card__quote">&ldquo;{item.quote}&rdquo;</p>
          )}

          <footer className="home-testimonial-card__footer">
            {item.avatar ? (
              <div className="home-testimonial-card__avatar">
                <Image
                  src={resolveCmsImageSrc(item.avatar.src)}
                  alt={item.avatar.alt || item.author || ""}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div
                className={`home-testimonial-card__initials home-testimonial-card__initials--${tone}`}
                aria-hidden="true"
              >
                {authorInitials(item.author)}
              </div>
            )}
            <div className="home-testimonial-card__meta">
              {item.author && (
                <p className="home-testimonial-card__author">{item.author}</p>
              )}
              {meta && <p className="home-testimonial-card__role">{meta}</p>}
            </div>
          </footer>
        </article>
      );
    };

    return (
      <section
        ref={sectionRef}
        className="home-testimonials-cards section-padding"
        data-section="testimonials"
        data-variant="home-cards"
      >
        <Container>
          <div className="home-testimonials-cards__header">
            <div className="home-testimonials-cards__titles">
              {data.eyebrow && (
                <p className="home-testimonials-cards__eyebrow">{data.eyebrow}</p>
              )}
              {data.heading && (
                <h2 className="home-testimonials-cards__heading">{data.heading}</h2>
              )}
            </div>
          </div>
        </Container>

        <div
          className="home-testimonials-cards__marquee"
          role="region"
          aria-roledescription="marquee"
          aria-label={data.heading ?? "Client testimonials"}
        >
          <div className="testimonial-inner home-testimonials-cards__track">
            {items.map((item, index) => renderCard(item, index, "a"))}
            {items.map((item, index) => renderCard(item, index, "b"))}
          </div>
        </div>

        {data.action && (
          <Container>
            <div className="mt-12 text-center">
              <Link
                href={data.action.href}
                className="home-cta-pill inline-flex items-center justify-center px-8 py-3.5 text-white transition-colors"
                style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}
              >
                {data.action.label}
              </Link>
            </div>
          </Container>
        )}
      </section>
    );
  }

  if (isSoftwareQuotesMarquee) {
    const items = data.items;
    const renderQuote = (item: (typeof items)[number], keyPrefix: string) => (
      <article key={`${keyPrefix}-${item.id}`} className="aptus-software-quote-card">
        {item.quote && <p className="aptus-software-quote-card__quote">{item.quote}</p>}
        {item.author && <h3 className="aptus-software-quote-card__author">{item.author}</h3>}
        {item.role && <p className="aptus-software-quote-card__role">{item.role}</p>}
        {item.company && <p className="aptus-software-quote-card__role">{item.company}</p>}
      </article>
    );

    return (
      <section
        ref={sectionRef}
        className="aptus-software-section aptus-software-quotes aptus-software-quotes--marquee"
        data-section="testimonials"
        data-variant="software-quotes-marquee"
      >
        <div className="aptus-live-container">
          {data.heading && (
            <h2 className="aptus-software-section-title aptus-software-section-title--lg">
              {data.heading}
            </h2>
          )}
          {data.subheading && <p className="aptus-software-section-lead">{data.subheading}</p>}
        </div>

        <div
          className="aptus-software-quotes__marquee"
          role="region"
          aria-roledescription="marquee"
          aria-label={data.heading ?? "Client testimonials"}
        >
          <div className="testimonial-inner aptus-software-quotes__track">
            {items.map((item) => renderQuote(item, "a"))}
            {items.map((item) => renderQuote(item, "b"))}
          </div>
        </div>
      </section>
    );
  }

  if (isSoftwareQuotes) {
    return (
      <section
        ref={sectionRef}
        className="aptus-software-section bg-white"
        data-section="testimonials"
        data-variant="software-quotes"
      >
        <div className="aptus-live-container">
          {data.heading && (
            <h2 className="aptus-software-section-title aptus-software-section-title--lg">
              {data.heading}
            </h2>
          )}
          {data.subheading && <p className="aptus-software-section-lead">{data.subheading}</p>}
          <div className="testimonial-inner aptus-software-quote-grid">
            {data.items.map((item) => (
              <article key={item.id} className="aptus-software-quote-card">
                {item.quote && <p className="aptus-software-quote-card__quote">{item.quote}</p>}
                {item.author && <h3 className="aptus-software-quote-card__author">{item.author}</h3>}
                {item.role && <p className="aptus-software-quote-card__role">{item.role}</p>}
                {item.company && <p className="aptus-software-quote-card__role">{item.company}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-brand-navy py-12 text-white sm:py-16 md:py-20"
      data-section="testimonials"
    >
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-green/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-blue/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="testimonial-inner">
          {data.items.map((item) => (
            <div key={item.id}>
              {item.quote && (
                <p
                  className="text-start leading-relaxed text-white/85"
                  style={{ fontSize: "var(--text-base)" }}
                >
                  {item.quote}
                </p>
              )}

              <div className="mt-8 text-center">
                {item.author && (
                  <p
                    className="text-center text-white"
                    style={{ fontSize: "var(--text-base)", fontWeight: 600 }}
                  >
                    {item.author}
                  </p>
                )}
                {item.role && (
                  <p
                    className="mt-1 text-center italic text-brand-green-light"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {item.role}
                  </p>
                )}
                {item.company && !item.role && (
                  <p
                    className="mt-1 text-center italic text-brand-green-light"
                    style={{ fontSize: "var(--text-sm)" }}
                  >
                    {item.company}
                  </p>
                )}

                {item.avatar && (
                  <div className="mx-auto mt-6 flex justify-center">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20">
                      <Image
                        src={resolveCmsImageSrc(item.avatar.src)}
                        alt={item.avatar.alt}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

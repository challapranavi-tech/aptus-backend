"use client";

import { Container } from "@/components/ui";
import { gsap } from "@/lib/gsap";
import { cn, isExternalHref, resolveCmsImageSrc } from "@/lib/utils";
import type { ActionLink, Hero as HeroData, MediaAsset } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface HeroProps {
  data: HeroData;
}

const SLIDE_MS = 5000;

function HeroActionDropdown({
  action,
  className,
}: {
  action: ActionLink;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const items = action.children ?? [];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <div className="home-hero-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`${className} home-hero-dropdown__trigger`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{action.label}</span>
        <svg
          className={cn(
            "home-hero-dropdown__chevron",
            open && "home-hero-dropdown__chevron--open",
          )}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul id={menuId} className="home-hero-dropdown__menu" role="menu">
          {items.map((item) => (
            <li key={`${item.label}-${item.href}`} role="none">
              <Link
                href={item.href}
                role="menuitem"
                className="home-hero-dropdown__item"
                onClick={() => setOpen(false)}
                {...(isExternalHref(item.href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function HeroBackgroundSlides({ images }: { images: MediaAsset[] }) {
  const [active, setActive] = useState(0);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionOk(!reduce);
    if (images.length < 2 || reduce) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [images.length]);

  return (
    <div className="home-hero-slides" aria-hidden="true">
      {images.map((img, i) => (
        <div
          key={`${img.src}-${i}`}
          className={cn(
            "home-hero-slide",
            i === active && "home-hero-slide--active",
            motionOk && "home-hero-slide--motion",
          )}
        >
          <Image
            src={resolveCmsImageSrc(img.src)}
            alt=""
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}
      <div className="home-hero-centered__veil" />
    </div>
  );
}

export function Hero({ data }: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isHomeCentered = data.variant === "home-centered";
  const backgroundImages = useMemo(() => {
    if (data.backgroundMedia && data.backgroundMedia.length > 0) {
      return data.backgroundMedia;
    }
    return data.media ? [data.media] : [];
  }, [data.backgroundMedia, data.media]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const items = contentRef.current?.querySelectorAll(".anim-item");
      if (!items) return;
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
      });
    }, contentRef);

    return () => ctx.revert();
  }, []);

  if (isHomeCentered) {
    return (
      <section
        className="home-hero-centered relative overflow-hidden"
        data-section="hero"
        data-variant="home-centered"
      >
        {backgroundImages.length > 0 && <HeroBackgroundSlides images={backgroundImages} />}

        <Container>
          <div ref={contentRef} className="relative z-10 mx-auto max-w-6xl text-center">
            <div className="mx-auto max-w-4xl">
              {(data.heading || data.headingAccent) && (
                <h1 className="anim-item home-hero-heading">
                  {data.heading}
                  {data.heading && data.headingAccent ? " " : null}
                  {data.headingAccent}
                </h1>
              )}
              {data.subheading &&
                data.subheading.split(/\n\n+/).map((line, i) => (
                  <p key={i} className="anim-item home-hero-support">
                    {line}
                  </p>
                ))}
              {data.tagline && (
                <p className="anim-item home-hero-categories">{data.tagline}</p>
              )}
              {(data.primaryAction || data.secondaryAction || data.tertiaryAction) && (
                <div className="anim-item home-hero-actions">
                  {data.primaryAction && (
                    <HeroActionDropdown
                      action={data.primaryAction}
                      className="home-hero-btn home-hero-btn--primary"
                    />
                  )}
                  {data.secondaryAction && (
                    <Link
                      href={data.secondaryAction.href}
                      className="home-hero-btn home-hero-btn--secondary"
                    >
                      {data.secondaryAction.label}
                    </Link>
                  )}
                  {data.tertiaryAction && (
                    <Link
                      href={data.tertiaryAction.href}
                      className="home-hero-btn home-hero-btn--quote"
                    >
                      {data.tertiaryAction.label}
                    </Link>
                  )}
                </div>
              )}
            </div>

            {data.highlights && data.highlights.length > 0 && (
              <ul className="anim-item home-hero-results">
                {data.highlights.map((item) => (
                  <li key={item.id} className="home-hero-result-card">
                    <h2 className="home-hero-result-card__title">{item.label}</h2>
                    {item.description && (
                      <p className="home-hero-result-card__body">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative section-padding overflow-hidden bg-brand-navy" data-section="hero">
      {data.media && (
        <>
          <Image
            src={resolveCmsImageSrc(data.media.src)}
            alt={data.media.alt}
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-dark/95 via-brand-navy/80 to-brand-navy/50" />
        </>
      )}

      <Container>
        <div ref={contentRef} className={cn("relative z-10 max-w-2xl")}>
          {(data.heading || data.headingAccent) && (
            <h1 className="anim-item" style={{ fontSize: "var(--text-5xl)", fontWeight: 700 }}>
              {data.heading}
              {data.heading && data.headingAccent ? " " : null}
              {data.headingAccent && <span className="text-brand-orange">{data.headingAccent}</span>}
            </h1>
          )}
          {data.subheading && (
            <p className="anim-item" style={{ fontSize: "var(--text-base)" }}>
              {data.subheading}
            </p>
          )}
          {(data.primaryAction || data.secondaryAction || data.tertiaryAction) && (
            <div className="anim-item mt-10 flex flex-wrap gap-4">
              {data.primaryAction && (
                <HeroActionDropdown
                  action={data.primaryAction}
                  className="inline-flex items-center gap-2 rounded-none bg-brand-orange px-7 py-3.5 text-white transition-all hover:bg-brand-orange-hover"
                />
              )}
              {data.secondaryAction && (
                <Link
                  href={data.secondaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none border border-white/30 px-7 py-3.5 text-white transition-all hover:border-brand-orange hover:text-brand-orange"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                >
                  {data.secondaryAction.label}
                </Link>
              )}
              {data.tertiaryAction && (
                <Link
                  href={data.tertiaryAction.href}
                  className="inline-flex items-center gap-2 rounded-none border border-white bg-white px-7 py-3.5 text-brand-navy transition-all hover:bg-transparent hover:text-white"
                  style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                >
                  {data.tertiaryAction.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

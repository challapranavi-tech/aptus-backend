"use client";

import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import { softwareHeroImage } from "@/data/software-product-media";

const HERO_BACKGROUNDS = [
  softwareHeroImage("aconex"),
  softwareHeroImage("autocad"),
  softwareHeroImage("microsoft-365-business"),
  softwareHeroImage("adobe-business-creative-solutions"),
].filter((src): src is string => Boolean(src));

const FLOATING_IMAGES = [
  { slug: "autocad-lt", alt: "AutoCAD LT", className: "aptus-software-catalog-hero__float--1" },
  { slug: "adobe-photoshop", alt: "Adobe Photoshop", className: "aptus-software-catalog-hero__float--2" },
  { slug: "revit", alt: "Revit", className: "aptus-software-catalog-hero__float--3" },
  { slug: "microsoft", alt: "Microsoft", className: "aptus-software-catalog-hero__float--4" },
  { slug: "civil-3d", alt: "Civil 3D", className: "aptus-software-catalog-hero__float--5" },
] as const;

export function SoftwareSolutionsHero() {
  const backgrounds =
    HERO_BACKGROUNDS.length > 0
      ? HERO_BACKGROUNDS
      : ["/images/imgi_8_photo-1581094794329-c8112a89af12-683x1024.png"];

  return (
    <section className="aptus-software-catalog-hero" aria-labelledby="software-catalog-heading">
      <div className="aptus-software-catalog-hero__bg-stack" aria-hidden>
        {backgrounds.map((src, index) => (
          <div
            key={src}
            className={`aptus-software-catalog-hero__bg aptus-software-catalog-hero__bg--${index + 1}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
      <div className="aptus-software-catalog-hero__overlay" aria-hidden />

      <div className="aptus-software-catalog-hero__floats" aria-hidden>
        {FLOATING_IMAGES.map((item) => {
          const src = softwareHeroImage(item.slug);
          if (!src) return null;
          return (
            <div key={item.alt} className={`aptus-software-catalog-hero__float ${item.className}`}>
              <div className="aptus-software-catalog-hero__float-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="eager" decoding="async" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="aptus-software-catalog-hero__content">
        <h1 id="software-catalog-heading" className="aptus-software-catalog-hero__title aptus-software-catalog-hero__title--glow">
          Premium Software Solutions for Modern Businesses
        </h1>
        <p className="aptus-software-catalog-hero__tagline">
          Empowering businesses with cutting-edge software from industry-leading brands
        </p>

        <div className="aptus-software-catalog-hero__intro">
          <p>
            Aptus Infotech is a leading provider of premium software solutions designed to help
            businesses streamline operations, enhance productivity, and drive growth. With over 25
            years of experience, we deliver genuine licenses, expert implementation, and
            comprehensive support.
          </p>
          <p>
            As an authorized partner of Autodesk, Adobe, Microsoft, Oracle, and more, we offer
            end-to-end services—from consultation and licensing to implementation and training—so
            you get maximum value from every investment.
          </p>
        </div>

        <div className="aptus-software-catalog-hero__actions">
          <ExploreProductsLink className="aptus-software-catalog-hero__btn aptus-software-catalog-hero__btn--primary">
            Explore products
          </ExploreProductsLink>
        </div>
      </div>
    </section>
  );
}

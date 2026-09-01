"use client";

import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";
import { SOFTWARE_PRODUCT_HERO_IMAGES } from "@/data/software-product-media";

const HERO_BG =
  "https://aptusinfotech.com/wp-content/uploads/2025/08/imgi_8_photo-1581094794329-c8112a89af12-683x1024.png";

const FLOATING_IMAGES = [
  {
    src: SOFTWARE_PRODUCT_HERO_IMAGES["autocad-lt"],
    alt: "AutoCAD LT",
    className: "aptus-software-catalog-hero__float--1",
  },
  {
    src: SOFTWARE_PRODUCT_HERO_IMAGES["adobe-photoshop"],
    alt: "Adobe Photoshop",
    className: "aptus-software-catalog-hero__float--2",
  },
  {
    src: SOFTWARE_PRODUCT_HERO_IMAGES["revit"],
    alt: "Revit",
    className: "aptus-software-catalog-hero__float--3",
  },
  {
    src: SOFTWARE_PRODUCT_HERO_IMAGES.microsoft,
    alt: "Microsoft",
    className: "aptus-software-catalog-hero__float--4",
  },
  {
    src: SOFTWARE_PRODUCT_HERO_IMAGES["civil-3d"],
    alt: "Civil 3D",
    className: "aptus-software-catalog-hero__float--5",
  },
] as const;

export function SoftwareSolutionsHero() {
  return (
    <section className="aptus-software-catalog-hero" aria-labelledby="software-catalog-heading">
      <div
        className="aptus-software-catalog-hero__bg"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="aptus-software-catalog-hero__overlay" aria-hidden />

      <div className="aptus-software-catalog-hero__floats" aria-hidden>
        {FLOATING_IMAGES.map((item) => (
          <div key={item.alt} className={`aptus-software-catalog-hero__float ${item.className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      <div className="aptus-software-catalog-hero__content">
        <p className="aptus-software-catalog-hero__eyebrow">Products and Services</p>
        <h1 id="software-catalog-heading" className="aptus-software-catalog-hero__title">
          Premium Software Solutions for Modern Businesses
        </h1>
        <p className="aptus-software-catalog-hero__tagline">
          Empowering businesses with cutting-edge software from industry-leading brands
        </p>

        <div className="aptus-software-catalog-hero__actions">
          <ExploreProductsLink className="aptus-software-catalog-hero__btn aptus-software-catalog-hero__btn--primary">
            Explore products
          </ExploreProductsLink>
        </div>

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
      </div>
    </section>
  );
}

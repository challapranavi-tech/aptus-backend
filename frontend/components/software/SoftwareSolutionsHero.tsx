"use client";

import { ExploreProductsLink } from "@/components/software/ExploreProductsLink";

export function SoftwareSolutionsHero() {
  return (
    <section className="aptus-software-catalog-hero" aria-labelledby="software-catalog-heading">
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

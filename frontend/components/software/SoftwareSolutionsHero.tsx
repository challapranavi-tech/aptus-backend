import Link from "next/link";

const HERO_BG =
  "https://aptusinfotech.com/wp-content/uploads/2025/08/imgi_8_photo-1581094794329-c8112a89af12-683x1024.png";

export function SoftwareSolutionsHero() {
  return (
    <section className="aptus-software-catalog-hero" aria-labelledby="software-catalog-heading">
      <div
        className="aptus-software-catalog-hero__bg"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div className="aptus-software-catalog-hero__overlay" aria-hidden />
      <div className="aptus-software-catalog-hero__content">
        <p className="aptus-software-catalog-hero__eyebrow">Products and Services</p>
        <h1 id="software-catalog-heading" className="aptus-software-catalog-hero__title">
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
          <a href="#software-catalog" className="aptus-software-catalog-hero__btn">
            Browse products
          </a>
          <Link href="#Form" className="aptus-software-catalog-hero__btn aptus-software-catalog-hero__btn--ghost">
            Request a quote
          </Link>
        </div>
      </div>
    </section>
  );
}

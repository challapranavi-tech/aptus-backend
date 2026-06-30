import Link from "next/link";
import { HeroEntrance, RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { AutodeskSubNav } from "@/components/pages/autodesk/AutodeskSubNav";
import { AutodeskProductJsonLd } from "@/components/pages/autodesk/AutodeskProductJsonLd";
import { AutodeskProductLeadForm } from "@/components/pages/autodesk/AutodeskProductLeadForm";
import { Container } from "@/components/ui";
import type { AutodeskProductContent } from "@/types/autodesk-product";

type AutodeskProductPageViewProps = {
  product: AutodeskProductContent;
};

export function AutodeskProductPageView({ product }: AutodeskProductPageViewProps) {
  return (
    <div className="autodesk-product-page">
      <AutodeskProductJsonLd product={product} />
      <AutodeskSubNav />

      <section className="autodesk-hero">
        <Container>
          <HeroEntrance>
            <div className="autodesk-hero__grid">
              <div className="autodesk-hero__copy">
                {product.productBadge ? (
                  <span className="autodesk-hero__badge">{product.productBadge}</span>
                ) : null}
                <p className="autodesk-hero__eyebrow">{product.categoryLabel}</p>
                <h1>{product.heroTitle}</h1>
                <p className="autodesk-hero__subtitle">{product.heroSubtitle}</p>
                {product.ctaText ? <p className="autodesk-hero__cta-text">{product.ctaText}</p> : null}
                <div className="autodesk-hero__actions">
                  <a href="#product-lead" className="autodesk-btn autodesk-btn--primary">
                    {product.ctaButtonLabel}
                  </a>
                  <Link href="/autodesk" className="autodesk-btn autodesk-btn--ghost">
                    All Autodesk Solutions
                  </Link>
                </div>
              </div>
              {product.heroImage ? (
                <div className="autodesk-hero__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.heroImage} alt={product.name} />
                </div>
              ) : (
                <div className="autodesk-hero__placeholder" aria-hidden>
                  <span>{product.name}</span>
                </div>
              )}
            </div>
          </HeroEntrance>
        </Container>
      </section>

      {(product.productDescription || product.productOverview || product.highlights.length > 0) && (
        <section className="autodesk-section autodesk-section--light">
          <Container>
            <RevealOnScroll>
              <div className="autodesk-overview">
                <div>
                  <h2>Product Overview</h2>
                  {product.productOverview ? <p>{product.productOverview}</p> : null}
                  {product.productDescription && product.productDescription !== product.productOverview ? (
                    <p>{product.productDescription}</p>
                  ) : null}
                </div>
                {product.highlights.length > 0 ? (
                  <ul className="autodesk-highlights">
                    {product.highlights.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </RevealOnScroll>
          </Container>
        </section>
      )}

      {product.features.length > 0 && (
        <section className="autodesk-section autodesk-section--grid">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">Capabilities</p>
                <h2>Key Features</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-card-grid">
              {product.features.map((feature, index) => (
                <RevealOnScroll key={feature.title} delay={index * 0.05}>
                  <article className="autodesk-card">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>
      )}

      {product.benefits.length > 0 && (
        <section className="autodesk-section autodesk-section--dark">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header autodesk-section__header--light">
                <p className="autodesk-section__eyebrow">Value</p>
                <h2>Business Benefits</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-card-grid autodesk-card-grid--two">
              {product.benefits.map((benefit, index) => (
                <RevealOnScroll key={benefit.title} delay={index * 0.06}>
                  <article className="autodesk-card autodesk-card--dark">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>
      )}

      {product.industries.length > 0 && (
        <section className="autodesk-section autodesk-section--light">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">Industries</p>
                <h2>Industry Applications</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-card-grid autodesk-card-grid--three">
              {product.industries.map((industry) => (
                <article key={industry.title} className="autodesk-card autodesk-card--compact">
                  <h3>{industry.title}</h3>
                  <p>{industry.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}

      {product.media.length > 0 && (
        <section className="autodesk-section autodesk-section--light">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">Media</p>
                <h2>Product Gallery</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-media-grid">
              {product.media.map((item) => (
                <figure key={item.url} className="autodesk-media">
                  {item.type === "video" ? (
                    <iframe src={item.url} title={item.title ?? product.name} loading="lazy" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title ?? product.name} loading="lazy" />
                  )}
                  {item.title ? <figcaption>{item.title}</figcaption> : null}
                </figure>
              ))}
            </div>
          </Container>
        </section>
      )}

      {product.downloads.length > 0 && (
        <section className="autodesk-section autodesk-section--grid">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">Resources</p>
                <h2>Downloads</h2>
              </header>
            </RevealOnScroll>
            <ul className="autodesk-downloads">
              {product.downloads.map((item) => (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <strong>{item.title}</strong>
                    {item.description ? <span>{item.description}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {product.faqs.length > 0 && (
        <section className="autodesk-section autodesk-section--light">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">FAQ</p>
                <h2>Frequently Asked Questions</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-faq">
              {product.faqs.map((faq) => (
                <details key={faq.question} className="autodesk-faq__item">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>
      )}

      {product.relatedProducts.length > 0 && (
        <section className="autodesk-section autodesk-section--grid">
          <Container>
            <RevealOnScroll>
              <header className="autodesk-section__header">
                <p className="autodesk-section__eyebrow">Related</p>
                <h2>Related Products</h2>
              </header>
            </RevealOnScroll>
            <div className="autodesk-related">
              {product.relatedProducts.map((related) => (
                <Link key={related.slug} href={`/${related.slug}`} className="autodesk-related__card">
                  <h3>{related.name}</h3>
                  <p>{related.heroSubtitle}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section id="product-lead" className="autodesk-section autodesk-section--lead">
        <Container>
          <div className="autodesk-lead-layout">
            <RevealOnScroll>
              <div>
                <p className="autodesk-section__eyebrow autodesk-section__eyebrow--light">Get Started</p>
                <h2>Speak with an Autodesk Specialist</h2>
                <p>
                  Request licensing, demos, or technical guidance for {product.name}. Our team in Oman
                  supports genuine Autodesk deployment for enterprise and project teams.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <AutodeskProductLeadForm productSlug={product.slug} productName={product.name} />
            </RevealOnScroll>
          </div>
        </Container>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/pages/aptus-solar.css";

export const metadata: Metadata = {
  title: "Aptus Solar",
  description:
    "Complete solar solutions from Aptus Solar Tech — design, supply, and installation support for businesses in Oman.",
};

/**
 * Placeholder hub for /aptus-solar.
 * Content sections will be filled in later.
 */
export default function AptusSolarPage() {
  return (
    <main className="aptus-solar-page">
      <section className="aptus-solar-hero" aria-labelledby="aptus-solar-heading">
        <div className="aptus-solar-hero__inner">
          <p className="aptus-solar-hero__eyebrow">Aptus Solar Tech</p>
          <h1 id="aptus-solar-heading" className="aptus-solar-hero__title">
            Aptus Solar
          </h1>
          <p className="aptus-solar-hero__lead">
            Complete solar solutions for businesses and projects across Oman.
            Detailed content for this page will be added soon.
          </p>
          <div className="aptus-solar-hero__actions">
            <Link href="#form" className="aptus-solar-btn aptus-solar-btn--primary">
              Request a Quote
            </Link>
            <Link href="#talk-to-expert" className="aptus-solar-btn aptus-solar-btn--secondary">
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>

      <section className="aptus-solar-placeholder" aria-label="Coming soon">
        <div className="aptus-solar-placeholder__inner">
          <h2>More content coming soon</h2>
          <p>
            This is a starter template for the Aptus Solar hub. Services, benefits,
            project highlights, and gallery sections can be added here later.
          </p>
        </div>
      </section>
    </main>
  );
}

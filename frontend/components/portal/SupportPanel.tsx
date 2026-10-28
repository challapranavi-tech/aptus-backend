import Link from "next/link";

export function SupportPanel() {
  return (
    <section className="aptus-portal-page-card aptus-portal-support" aria-label="Support Tickets">
      <p className="aptus-portal-support__empty">No open tickets.</p>
      <div className="aptus-portal-support__actions">
        <a className="aptus-portal-btn aptus-portal-btn--primary" href="mailto:info@aptusinfotech.com">
          Raise a ticket
        </a>
        <p className="aptus-portal-support__alt">
          Or call{" "}
          <a href="tel:+96899418481">+968 9941 8481</a>
          {" · "}
          <Link href="/portal/videos" className="aptus-overview-compact__link">
            Help videos
          </Link>
        </p>
      </div>
    </section>
  );
}

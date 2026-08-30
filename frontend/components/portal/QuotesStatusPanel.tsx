"use client";

import Link from "next/link";
import { useQuotes } from "@/hooks/useQuotes";
import type { QuoteLifecycleStatus } from "@/types/quotes";

function statusTone(status: QuoteLifecycleStatus): string {
  switch (status) {
    case "Quotation Sent":
      return "accent";
    case "Payment Pending":
      return "warning";
    case "Payment Received":
    case "Won":
      return "success";
    case "Lost":
      return "danger";
    default:
      return "processing";
  }
}

/** Odoo-driven Request Quote lifecycle for the portal status view. */
export function QuotesStatusPanel() {
  const { quotes, loading, error } = useQuotes();

  return (
    <section className="aptus-portal-page-card aptus-portal-quotes" aria-label="Quote status">
      <div className="aptus-portal-quotes__head">
        <div>
          <h2>Quote status</h2>
          <p>
            Updates from Odoo after you Request a Quote — when sales sends a quotation, payment is
            recorded, or the opportunity changes.
          </p>
        </div>
        <Link href="/portal/products" className="aptus-overview-compact__link">
          Request a Quote
        </Link>
      </div>

      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading quote status…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="aptus-odoo-subscriptions__state aptus-odoo-subscriptions__state--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && quotes.length === 0 ? (
        <div className="aptus-odoo-subscriptions__state">
          <p>
            No quote requests yet.{" "}
            <Link href="/portal/products" className="aptus-overview-compact__link">
              Request a Quote
            </Link>{" "}
            from Products — status will appear here once sales updates Odoo.
          </p>
        </div>
      ) : null}

      {!loading && !error && quotes.length > 0 ? (
        <div className="aptus-portal-table-wrap">
          <table className="aptus-portal-table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Product</th>
                <th scope="col">Status</th>
                <th scope="col">Odoo stage</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.reference}</td>
                  <td>{quote.productName}</td>
                  <td>
                    <span className={`aptus-portal-pill aptus-portal-pill--${statusTone(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="is-muted">{quote.stageLabel}</td>
                  <td className="is-muted">
                    {new Date(quote.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

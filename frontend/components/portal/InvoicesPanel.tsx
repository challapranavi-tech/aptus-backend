"use client";

import { useState } from "react";
import { authFetch } from "@/lib/access-token";
import { formatShortDate } from "@/lib/overview-data";
import { ordersWithPaymentProof } from "@/lib/portal-invoices";
import { useOrders } from "@/hooks/useOrders";
import type { PortalOrder } from "@/types/orders";

function productLabel(order: PortalOrder): string {
  if (order.items.length === 0) return order.reference;
  if (order.items.length === 1) return order.items[0].productName;
  return `${order.items[0].productName} +${order.items.length - 1}`;
}

async function downloadPaymentProof(order: PortalOrder): Promise<void> {
  const response = await authFetch(
    order.paymentProofUrl ?? `/api/orders/${encodeURIComponent(order.id)}/payment-proof`,
  );
  if (!response.ok) {
    throw new Error("Could not download file");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = order.paymentProofFileName ?? `${order.reference}-payment-proof`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InvoicesPanel() {
  const { allOrders, loading, error } = useOrders();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const invoices = ordersWithPaymentProof(allOrders);

  async function handleDownload(order: PortalOrder) {
    setBusyId(order.id);
    setDownloadError(null);
    try {
      await downloadPaymentProof(order);
    } catch {
      setDownloadError("Download failed. Try again or contact support.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="aptus-dashboard-card aptus-portal-invoices" aria-label="Payment attachments">
      <div className="aptus-dashboard-section-head">
        <div>
          <h2>Invoices &amp; payment attachments</h2>
          <p>Files you uploaded as payment proof during bank transfer checkout.</p>
        </div>
      </div>

      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading attachments…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="aptus-odoo-subscriptions__state aptus-odoo-subscriptions__state--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && downloadError ? (
        <p className="aptus-portal-invoices__error" role="alert">
          {downloadError}
        </p>
      ) : null}

      {!loading && !error && invoices.length === 0 ? (
        <div className="aptus-odoo-subscriptions__state">
          <p>No payment attachments yet. Upload proof when paying by bank transfer on an approved order.</p>
        </div>
      ) : null}

      {!loading && !error && invoices.length > 0 ? (
        <ul className="aptus-portal-invoices__list">
          {invoices.map((order) => (
            <li key={order.id} className="aptus-portal-invoices__item">
              <div className="aptus-portal-invoices__meta">
                <strong>{order.paymentProofFileName ?? "Payment proof"}</strong>
                <span>{order.reference}</span>
                <span>{productLabel(order)}</span>
                {order.paymentProofUploadedAt ? (
                  <time dateTime={order.paymentProofUploadedAt}>
                    Uploaded {formatShortDate(order.paymentProofUploadedAt)}
                  </time>
                ) : (
                  <time dateTime={order.updatedAt}>Order {formatShortDate(order.updatedAt)}</time>
                )}
              </div>
              <button
                type="button"
                className="btn btn-aptus-primary aptus-portal-invoices__download"
                disabled={busyId === order.id}
                onClick={() => void handleDownload(order)}
              >
                {busyId === order.id ? "Downloading…" : "Download"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

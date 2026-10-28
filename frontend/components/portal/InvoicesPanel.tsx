"use client";

import Link from "next/link";
import { useState } from "react";
import { authFetch } from "@/lib/access-token";
import { formatOmanAmount, estimateOrderPricing } from "@/lib/order-pricing";
import { formatShortDate } from "@/lib/overview-data";
import { ordersWithPaymentProof } from "@/lib/portal-invoices";
import { useOrders } from "@/hooks/useOrders";
import type { PortalOrder } from "@/types/orders";

function productLabel(order: PortalOrder): string {
  if (order.items.length === 0) return order.reference;
  if (order.items.length === 1) return order.items[0].productName;
  return `${order.items[0].productName} +${order.items.length - 1}`;
}

function invoiceAmount(order: PortalOrder): string {
  if (order.amountDue && order.amountDue > 0) return formatOmanAmount(order.amountDue);
  const pricing = estimateOrderPricing(order);
  if (pricing?.complete) return formatOmanAmount(pricing.total);
  return "—";
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
    <section className="aptus-portal-page-card aptus-portal-invoices" aria-label="Invoices">
      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading invoices…</p>
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
          <p>
            No invoices yet.{" "}
            <Link href="/portal/orders" className="aptus-overview-compact__link">
              View orders
            </Link>{" "}
            after payment proof is uploaded.
          </p>
        </div>
      ) : null}

      {!loading && !error && invoices.length > 0 ? (
        <div className="aptus-portal-table-wrap">
          <table className="aptus-portal-table">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Product</th>
                <th scope="col">Date</th>
                <th scope="col" className="is-right">
                  Amount
                </th>
                <th scope="col" className="is-right">
                  Download
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((order) => (
                <tr key={order.id}>
                  <td>{order.paymentProofFileName ?? order.reference}</td>
                  <td>{productLabel(order)}</td>
                  <td className="is-muted">
                    {formatShortDate(order.paymentProofUploadedAt ?? order.updatedAt)}
                  </td>
                  <td className="is-right">{invoiceAmount(order)}</td>
                  <td className="is-right">
                    <button
                      type="button"
                      className="aptus-portal-btn aptus-portal-btn--primary"
                      disabled={busyId === order.id}
                      onClick={() => void handleDownload(order)}
                    >
                      {busyId === order.id ? "Downloading…" : "Download"}
                    </button>
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

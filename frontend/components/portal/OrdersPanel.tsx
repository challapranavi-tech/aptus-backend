"use client";

import Link from "next/link";
import { useState } from "react";
import { OrderPaymentModal } from "./OrderPaymentModal";
import {
  canMakePayment,
  getOrderDisplayStatus,
  isOrdersPageOrder,
  orderRowStatusLabel,
  orderRowStatusTone,
} from "@/lib/order-status";
import { formatShortDate } from "@/lib/overview-data";
import { notifyPortalDataChanged } from "@/lib/portal-data-events";
import type { PortalOrder } from "@/types/orders";
import type { OrderDisplayStatus } from "@/lib/order-status";

const STATUS_FILTERS: Array<
  "all" | "Payment Verification Pending" | "Payment Verified" | "License Issued"
> = ["all", "Payment Verification Pending", "Payment Verified", "License Issued"];

function durationLabel(duration: PortalOrder["duration"]): string {
  return duration === "3year" ? "3 Years" : "Annual";
}

function matchesFilter(
  order: PortalOrder,
  filter: "all" | OrderDisplayStatus,
): boolean {
  if (filter === "all") return true;
  return getOrderDisplayStatus(order) === filter;
}

function productLabel(order: PortalOrder): string {
  if (order.items.length === 0) return order.reference;
  if (order.items.length === 1) return order.items[0].productName;
  return `${order.items[0].productName} +${order.items.length - 1}`;
}

type OrdersPanelProps = {
  orders: PortalOrder[];
  loading: boolean;
  error: string | null;
  limit?: number;
};

export function OrdersPanel({ orders, loading, error, limit }: OrdersPanelProps) {
  const [filter, setFilter] = useState<
    "all" | "Payment Verification Pending" | "Payment Verified" | "License Issued"
  >("all");
  const [payOrder, setPayOrder] = useState<PortalOrder | null>(null);

  const pageOrders = orders.filter(isOrdersPageOrder);
  const filtered = pageOrders.filter((order) => matchesFilter(order, filter));
  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <section className="aptus-portal-page-card aptus-portal-orders" aria-label="My orders">
      {!limit ? (
        <div className="aptus-portal-chips" role="tablist" aria-label="Filter orders by status">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`aptus-portal-chip${filter === item ? " is-active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading your orders…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="aptus-odoo-subscriptions__state aptus-odoo-subscriptions__state--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <div className="aptus-odoo-subscriptions__state">
          <p>
            No orders in this view yet.{" "}
            <Link href="/portal/products" className="aptus-overview-compact__link">
              Browse products
            </Link>{" "}
            to place an order.
          </p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-portal-table-wrap">
          <table className="aptus-portal-table">
            <thead>
              <tr>
                <th scope="col">Order ID</th>
                <th scope="col">Product</th>
                <th scope="col">Order date</th>
                <th scope="col">Status</th>
                <th scope="col">License type</th>
                <th scope="col">Invoice</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => {
                const displayStatus = getOrderDisplayStatus(order);
                const hasInvoice = Boolean(order.paymentProofUrl || order.paymentProofFileName);
                return (
                  <tr key={order.id}>
                    <td>{order.reference}</td>
                    <td>{productLabel(order)}</td>
                    <td className="is-muted">{formatShortDate(order.createdAt)}</td>
                    <td>
                      <span className={`aptus-portal-pill aptus-portal-pill--${orderRowStatusTone(displayStatus)}`}>
                        {orderRowStatusLabel(displayStatus)}
                      </span>
                    </td>
                    <td>{durationLabel(order.duration)}</td>
                    <td>
                      {hasInvoice ? (
                        <Link href="/portal/invoices" className="aptus-overview-compact__link">
                          View invoice
                        </Link>
                      ) : (
                        <span className="is-muted">Pending</span>
                      )}
                    </td>
                    <td>
                      {canMakePayment(order) ? (
                        <button
                          type="button"
                          className="aptus-portal-btn aptus-portal-btn--primary"
                          onClick={() => setPayOrder(order)}
                        >
                          Make payment
                        </button>
                      ) : displayStatus === "License Issued" ? (
                        <Link href="/portal/subscriptions" className="aptus-overview-compact__link">
                          View license
                        </Link>
                      ) : (
                        <span className="is-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <OrderPaymentModal
        order={payOrder}
        open={payOrder !== null}
        onClose={() => setPayOrder(null)}
        onPaid={() => notifyPortalDataChanged("orders")}
      />
    </section>
  );
}

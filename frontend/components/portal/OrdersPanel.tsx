"use client";

import { useState } from "react";
import { OrderPaymentModal } from "./OrderPaymentModal";
import {
  canMakePayment,
  getOrderDisplayStatus,
  isOrdersPageOrder,
  orderStatusClass,
  orderStatusHint,
} from "@/lib/order-status";
import { notifyPortalDataChanged } from "@/lib/portal-data-events";
import type { PortalOrder } from "@/types/orders";
import type { OrderDisplayStatus } from "@/lib/order-status";

const STATUS_FILTERS: Array<
  "all" | "Payment Verification Pending" | "Payment Verified" | "License Issued"
> = ["all", "Payment Verification Pending", "Payment Verified", "License Issued"];

function durationLabel(duration: PortalOrder["duration"]): string {
  return duration === "3year" ? "3 Years" : "1 Year";
}

function matchesFilter(
  order: PortalOrder,
  filter: "all" | OrderDisplayStatus,
): boolean {
  if (filter === "all") return true;
  return getOrderDisplayStatus(order) === filter;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payOrder, setPayOrder] = useState<PortalOrder | null>(null);

  // Payment proof submitted through license issued
  const pageOrders = orders.filter(isOrdersPageOrder);
  const filtered = pageOrders.filter((order) => matchesFilter(order, filter));
  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <section className="aptus-dashboard-card aptus-odoo-orders" aria-label="My orders">
      <div className="aptus-dashboard-section-head">
        <div>
          <h2>Software purchase requests</h2>
          <p>
            Track payment verification, payment confirmed, and licenses that have been issued.
          </p>
        </div>
      </div>

      {!limit ? (
        <div className="aptus-orders-filters" role="tablist" aria-label="Filter orders by status">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={filter === item ? "is-active" : ""}
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
            No orders in this view yet. Complete payment on a purchase request to see it here.
          </p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-orders-list">
          {visible.map((order) => {
            const isOpen = expandedId === order.id;
            const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const displayStatus = getOrderDisplayStatus(order);
            const statusHint = orderStatusHint(displayStatus);
            return (
              <article key={order.id} className="aptus-order-card">
                <header className="aptus-order-card__head">
                  <div>
                    <span className="aptus-order-card__ref">{order.reference}</span>
                    <strong>{order.items.map((item) => item.productName).join(", ")}</strong>
                  </div>
                  <div className="aptus-order-card__actions">
                    <mark className={`aptus-status ${orderStatusClass(displayStatus)}`}>
                      {displayStatus}
                    </mark>
                    {canMakePayment(order) ? (
                      <button
                        type="button"
                        className="aptus-order-card__pay"
                        onClick={() => setPayOrder(order)}
                      >
                        Make Payment
                      </button>
                    ) : null}
                  </div>
                </header>
                {statusHint ? <p className="aptus-order-card__hint">{statusHint}</p> : null}
                <div className="aptus-order-card__meta">
                  <span>{durationLabel(order.duration)}</span>
                  <span>{totalQty} item{totalQty === 1 ? "" : "s"}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
                <button
                  type="button"
                  className="aptus-order-card__toggle"
                  aria-expanded={isOpen}
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                >
                  {isOpen ? "Hide details" : "View details"}
                </button>
                {isOpen ? (
                  <div className="aptus-order-card__details">
                    <ul>
                      {order.items.map((item) => (
                        <li key={`${item.category}-${item.productName}`}>
                          {item.category} — {item.productName} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
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

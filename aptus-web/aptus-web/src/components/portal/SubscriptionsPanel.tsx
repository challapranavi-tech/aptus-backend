"use client";

import { useEffect } from "react";
import { SubscriptionCard } from "./SubscriptionCard";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import type { SubscriptionStatus } from "@/types/subscriptions";

type SubscriptionsPanelProps = {
  /** When set, only the first N subscriptions are shown (dashboard overview). */
  limit?: number;
  statusFilter?: SubscriptionStatus | "all";
};

export function SubscriptionsPanel({ limit, statusFilter = "all" }: SubscriptionsPanelProps) {
  const { subscriptions, loading, error, reload } = useSubscriptions();
  const filtered =
    statusFilter === "all"
      ? subscriptions
      : subscriptions.filter((subscription) => subscription.status === statusFilter);
  const visible = limit ? filtered.slice(0, limit) : filtered;

  useEffect(() => {
    if (loading) {
      return;
    }
    const syncMetrics = () => {
      window.aptusPortalAuth?.setSubscriptions?.(subscriptions);
    };
    syncMetrics();
    window.addEventListener("aptus:portal-ready", syncMetrics);
    return () => {
      window.removeEventListener("aptus:portal-ready", syncMetrics);
    };
  }, [subscriptions, loading]);

  return (
    <section className="aptus-dashboard-card aptus-odoo-subscriptions" aria-label="My subscriptions">
      <div className="aptus-dashboard-section-head">
        <div>
          <span className="aptus-section__eyebrow">My Subscriptions</span>
          <h2>
            {statusFilter === "Expiring Soon"
              ? "Subscriptions expiring soon"
              : "Active subscriptions from your account"}
          </h2>
          <p>
            Product name, purchase date, renewal date, status, and license ID loaded from Odoo.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading your subscriptions…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="aptus-odoo-subscriptions__state aptus-odoo-subscriptions__state--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <div className="aptus-odoo-subscriptions__state">
          <p>No active subscriptions yet. Orders will appear here once confirmed in Odoo.</p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-lifecycle-grid">
          {visible.map((subscription) => (
            <SubscriptionCard
              key={
                subscription.lineId ??
                `${subscription.orderId ?? "order"}-${subscription.productName}-${subscription.purchaseDate}`
              }
              subscription={subscription}
              onActionComplete={reload}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

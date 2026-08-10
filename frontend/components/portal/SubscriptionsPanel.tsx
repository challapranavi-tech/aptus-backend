"use client";

import { SubscriptionCard } from "./SubscriptionCard";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import type { SubscriptionStatus } from "@/types/subscriptions";

type SubscriptionsPanelProps = {
  /** When set, only the first N subscriptions are shown (dashboard overview). */
  limit?: number;
  statusFilter?: SubscriptionStatus | "all";
  /** License page: emphasize keys and downloads. */
  licenseView?: boolean;
};

export function SubscriptionsPanel({
  limit,
  statusFilter = "all",
  licenseView = false,
}: SubscriptionsPanelProps) {
  const { subscriptions, loading, error, reload } = useSubscriptions();
  const filtered =
    statusFilter === "all"
      ? subscriptions
      : subscriptions.filter((subscription) => subscription.status === statusFilter);
  const visible = limit ? filtered.slice(0, limit) : filtered;

  return (
    <section
      className="aptus-dashboard-card aptus-odoo-subscriptions"
      aria-label={licenseView ? "My licenses" : "My subscriptions"}
    >
      <div className="aptus-dashboard-section-head">
        <div>
          <h2>
            {licenseView
              ? "Your software licenses"
              : statusFilter === "Expiring Soon"
                ? "Subscriptions expiring soon"
                : "Subscriptions & renewals"}
          </h2>
          <p>
            {licenseView
              ? "License keys, download links, and renewal dates for your purchased software."
              : "Manage active subscriptions, renewals, upgrades, and cancellations."}
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

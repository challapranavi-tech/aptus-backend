"use client";

import Link from "next/link";
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
      className="aptus-portal-licenses"
      aria-label={licenseView ? "My licenses" : "My subscriptions"}
    >
      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading your licenses…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="aptus-odoo-subscriptions__state aptus-odoo-subscriptions__state--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <div className="aptus-portal-page-card aptus-odoo-subscriptions__state">
          <p>
            No active licenses yet.{" "}
            <Link href="/portal/products" className="aptus-overview-compact__link">
              Buy software
            </Link>{" "}
            or check{" "}
            <Link href="/portal/orders" className="aptus-overview-compact__link">
              orders
            </Link>
            .
          </p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-portal-licenses__grid">
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

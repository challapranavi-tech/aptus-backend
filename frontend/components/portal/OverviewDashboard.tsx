"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { useOrders } from "@/hooks/useOrders";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { estimateOrderPricing, formatOmanAmount } from "@/lib/order-pricing";
import {
  getOrderDisplayStatus,
  orderRowStatusLabel,
  orderRowStatusTone,
} from "@/lib/order-status";
import {
  buildAccountHealth,
  formatRenewalReminderLabel,
  formatShortDate,
  getUpcomingRenewalReminders,
} from "@/lib/overview-data";
import { HelpVideosPanel, helpVideosTotal } from "./HelpVideosPanel";
import { PortalNavIcon } from "./PortalNavIcon";

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="aptus-overview-v3__loading" role="status" aria-live="polite">
      <div className="aptus-payment-processing__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function productInitials(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "APP";
}

function daysPillTone(daysLeft: number): "danger" | "warning" | "success" {
  if (daysLeft <= 14) return "danger";
  if (daysLeft <= 45) return "warning";
  return "success";
}

export function OverviewDashboard() {
  const { user, ready } = useAuth();
  const { allOrders, loading: ordersLoading } = useOrders();
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const { notifications, loading: notificationsLoading } = useNotifications();

  if (!ready || !user) {
    return <LoadingBlock label="Loading your workspace…" />;
  }

  const loading = ordersLoading || subscriptionsLoading || notificationsLoading;
  const health = buildAccountHealth(user, allOrders, subscriptions, notifications);
  const recentOrders = allOrders.slice(0, 3);
  const renewalReminders = getUpcomingRenewalReminders(subscriptions, 90, 4);
  const urgentRenewal = renewalReminders[0];
  const activeSoftware = subscriptions.slice(0, 3);
  const totalLicenses = Math.max(subscriptions.length, health.activeSubscriptions);
  const activeLicenses = health.activeSubscriptions;
  const ringPct =
    totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0;
  const expiredCount = Math.max(totalLicenses - activeLicenses, 0);

  return (
    <div className="aptus-overview-compact">
      {loading ? (
        <LoadingBlock label="Loading dashboard…" />
      ) : (
        <>
          {urgentRenewal ? (
            <div className="aptus-overview-compact__alert" role="status">
              <PortalNavIcon name="key" />
              <span>
                <strong>{urgentRenewal.productName}</strong>{" "}
                {formatRenewalReminderLabel(urgentRenewal.daysLeft).replace(/^Expires /, "expires ")}
              </span>
              <Link href="/portal/subscriptions" className="aptus-overview-compact__alert-btn">
                Renew now
              </Link>
            </div>
          ) : null}

          <div className="aptus-overview-compact__stats">
            <Link href="/portal/subscriptions" className="aptus-overview-compact__stat">
              <PortalNavIcon name="key" />
              <p className="aptus-overview-compact__stat-num">{activeLicenses}</p>
              <p className="aptus-overview-compact__stat-lbl">Active licenses</p>
            </Link>
            <Link href="/portal/subscriptions" className="aptus-overview-compact__stat">
              <PortalNavIcon name="bell" />
              <p className="aptus-overview-compact__stat-num">{health.renewalsDue}</p>
              <p className="aptus-overview-compact__stat-lbl">Renewals due soon</p>
            </Link>
            <Link href="/portal/orders" className="aptus-overview-compact__stat">
              <PortalNavIcon name="orders" />
              <p className="aptus-overview-compact__stat-num">{allOrders.length}</p>
              <p className="aptus-overview-compact__stat-lbl">Total orders</p>
            </Link>
            <Link href="/portal/support" className="aptus-overview-compact__stat">
              <PortalNavIcon name="support" />
              <p className="aptus-overview-compact__stat-num">{health.openSupportTickets}</p>
              <p className="aptus-overview-compact__stat-lbl">Open support tickets</p>
            </Link>
          </div>

          <div className="aptus-overview-compact__hero">
            <section className="aptus-overview-compact__card" aria-label="Your licenses">
              <div className="aptus-overview-compact__section-title">
                <h3>Your licenses</h3>
                <Link href="/portal/subscriptions" className="aptus-overview-compact__link">
                  Manage all
                </Link>
              </div>
              <div className="aptus-overview-compact__license-visual">
                <div
                  className="aptus-overview-compact__ring"
                  style={{
                    background: `conic-gradient(#2f80ed 0 ${ringPct}%, #e6edf4 ${ringPct}% 100%)`,
                  }}
                  aria-hidden="true"
                >
                  <strong>
                    {activeLicenses}/{Math.max(totalLicenses, 1)}
                  </strong>
                </div>
                <div>
                  <div className="aptus-overview-compact__license-headline">
                    {activeLicenses} active license{activeLicenses === 1 ? "" : "s"}
                  </div>
                  <p className="aptus-overview-compact__license-copy">
                    {expiredCount > 0
                      ? `${expiredCount} license${expiredCount === 1 ? "" : "s"} expired or inactive. Renew to restore access.`
                      : "All licenses look healthy. Browse products when you need another seat."}
                  </p>
                  <div className="aptus-overview-compact__quick-actions">
                    <Link href="/portal/subscriptions">
                      <PortalNavIcon name="key" /> View licenses
                    </Link>
                    <Link href="/portal/products">
                      <PortalNavIcon name="box" /> Buy software
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="aptus-overview-compact__card aptus-overview-compact__renewals" aria-label="Upcoming renewals">
              <div className="aptus-overview-compact__section-title">
                <h3>Upcoming renewals</h3>
                <Link href="/portal/subscriptions" className="aptus-overview-compact__link">
                  View all
                </Link>
              </div>
              {renewalReminders.length === 0 ? (
                <p className="aptus-overview-compact__empty">No renewals due in the next 90 days.</p>
              ) : (
                renewalReminders.map((subscription, index) => (
                  <Link
                    key={`${subscription.productName}-${subscription.lineId ?? index}`}
                    href="/portal/subscriptions"
                    className={`aptus-overview-compact__renew-item${index === 0 ? " is-first" : ""}`}
                  >
                    <span className="aptus-overview-compact__renew-icon" aria-hidden="true">
                      <PortalNavIcon name="key" />
                    </span>
                    <span className="aptus-overview-compact__renew-main">
                      <strong>{subscription.productName}</strong>
                      <span>Expires {formatShortDate(subscription.renewalDateIso ?? subscription.renewalDate)}</span>
                    </span>
                    <span className={`aptus-portal-pill aptus-portal-pill--${daysPillTone(subscription.daysLeft)}`}>
                      {subscription.daysLeft} days
                    </span>
                  </Link>
                ))
              )}
            </section>
          </div>

          <section className="aptus-overview-compact__card" aria-label="Active software">
            <div className="aptus-overview-compact__section-title">
              <h3>Active software</h3>
              <Link href="/portal/subscriptions" className="aptus-overview-compact__link">
                Manage licenses
              </Link>
            </div>
            {activeSoftware.length === 0 ? (
              <p className="aptus-overview-compact__empty">
                No licenses yet.{" "}
                <Link href="/portal/products" className="aptus-overview-compact__link">
                  Browse products
                </Link>
              </p>
            ) : (
              <div className="aptus-overview-compact__license-mini">
                {activeSoftware.map((subscription) => {
                  const expired = subscription.status === "Expired" || subscription.status === "Cancelled";
                  const soon = subscription.status === "Expiring Soon";
                  return (
                    <div key={`${subscription.productName}-${subscription.lineId ?? subscription.orderId}`} className="aptus-overview-compact__license-tile">
                      <div className="aptus-overview-compact__ltop">
                        <div className={`aptus-overview-compact__logo${expired ? " is-muted" : ""}`}>
                          {productInitials(subscription.productName)}
                        </div>
                        <div>
                          <strong>{subscription.productName}</strong>
                          <small>
                            {expired
                              ? `Expired · ${subscription.expiryDate || subscription.renewalDate || "—"}`
                              : `${subscription.status}${soon ? "" : ""} · ${subscription.renewalDate || "—"}`}
                          </small>
                        </div>
                      </div>
                      {expired ? (
                        <Link href="/portal/products" className="aptus-overview-compact__tile-btn">
                          Renew license
                        </Link>
                      ) : soon ? (
                        <span className="aptus-portal-pill aptus-portal-pill--danger">Renew soon</span>
                      ) : (
                        <span className="aptus-portal-pill aptus-portal-pill--success">Active</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="aptus-overview-compact__card" aria-label="Help videos">
            <div className="aptus-overview-compact__section-title">
              <h3>Learn & get more from your software</h3>
              <Link href="/portal/videos" className="aptus-overview-compact__link">
                View all {helpVideosTotal()}
              </Link>
            </div>
            <HelpVideosPanel limit={3} />
          </section>

          <section className="aptus-overview-compact__card" aria-label="Recent orders">
            <div className="aptus-overview-compact__section-title">
              <h3>Recent orders</h3>
              <Link href="/portal/orders" className="aptus-overview-compact__link">
                View all orders
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="aptus-overview-compact__empty">
                No orders yet.{" "}
                <Link href="/portal/products" className="aptus-overview-compact__link">
                  Browse products
                </Link>
              </p>
            ) : (
              <div className="aptus-overview-compact__table-wrap">
                <table className="aptus-overview-compact__table">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date</th>
                      <th scope="col" className="is-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const displayStatus = getOrderDisplayStatus(order);
                      const pricing = estimateOrderPricing(order);
                      const amount =
                        order.amountDue && order.amountDue > 0
                          ? formatOmanAmount(order.amountDue)
                          : pricing?.complete
                            ? formatOmanAmount(pricing.total)
                            : "—";
                      const productLabel =
                        order.items.length === 1
                          ? order.items[0].productName
                          : `${order.items[0]?.productName ?? "Order"} +${Math.max(order.items.length - 1, 0)}`;

                      return (
                        <tr key={order.id}>
                          <td>
                            <Link href="/portal/orders" className="aptus-overview-compact__row-link">
                              {productLabel}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`aptus-portal-pill aptus-portal-pill--${orderRowStatusTone(displayStatus)}`}
                            >
                              {orderRowStatusLabel(displayStatus)}
                            </span>
                          </td>
                          <td className="is-muted">{formatShortDate(order.createdAt)}</td>
                          <td className="is-right">{amount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

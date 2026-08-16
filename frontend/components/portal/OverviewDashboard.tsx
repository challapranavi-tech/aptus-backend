"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { useOrders } from "@/hooks/useOrders";
import { usePortalCartCount } from "@/hooks/usePortalCartCount";
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
import { PortalNavIcon } from "./PortalNavIcon";

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="aptus-overview-v3__loading" role="status" aria-live="polite">
      <div className="aptus-payment-processing__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function StatCard({
  tone,
  icon,
  value,
  label,
  href,
}: {
  tone: "blue" | "green" | "orange" | "purple";
  icon: Parameters<typeof PortalNavIcon>[0]["name"];
  value: string | number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`aptus-overview-v3__stat aptus-overview-v3__stat--${tone} aptus-overview-v3__stat-link`}
      aria-label={`${label}: ${value}`}
    >
      <span className="aptus-overview-v3__stat-icon" aria-hidden="true">
        <PortalNavIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function OverviewDashboard() {
  const { user, ready } = useAuth();
  const { allOrders, loading: ordersLoading } = useOrders();
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const cartCount = usePortalCartCount();

  if (!ready || !user) {
    return <LoadingBlock label="Loading your workspace…" />;
  }

  const loading = ordersLoading || subscriptionsLoading || notificationsLoading;
  const health = buildAccountHealth(user, allOrders, subscriptions, notifications);
  const recentOrders = allOrders.slice(0, 5);
  const renewalReminders = getUpcomingRenewalReminders(subscriptions);

  return (
    <div className="aptus-overview-v3">
      {loading ? (
        <LoadingBlock label="Loading dashboard…" />
      ) : (
        <>
          <div className="aptus-overview-v3__stats">
            <StatCard
              tone="blue"
              icon="orders"
              value={allOrders.length}
              label="Total Orders"
              href="/portal/orders"
            />
            <StatCard
              tone="green"
              icon="key"
              value={health.activeSubscriptions}
              label="Active Licenses"
              href="/portal/subscriptions"
            />
            <StatCard
              tone="orange"
              icon="support"
              value={health.openSupportTickets}
              label="Support Tickets"
              href="/portal/support"
            />
            <StatCard
              tone="purple"
              icon="box"
              value={cartCount}
              label="Cart"
              href="/portal/cart"
            />
          </div>

          <div className="aptus-overview-v3__grid">
            <section className="aptus-overview-v3__card aptus-overview-v3__orders" aria-label="Recent orders">
              <div className="aptus-overview-v3__card-head">
                <h2>Recent Orders</h2>
                <Link href="/portal/orders" className="aptus-overview-v3__link">
                  View all
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <p className="aptus-overview-v3__empty">No orders yet. Browse products to place your first order.</p>
              ) : (
                <div className="aptus-overview-v3__table-wrap">
                  <table className="aptus-overview-v3__table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Status</th>
                        <th scope="col">Date</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Total</th>
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
                            <td>{productLabel}</td>
                            <td>
                              <span
                                className={`aptus-overview-v3__badge aptus-overview-v3__badge--${orderRowStatusTone(displayStatus)}`}
                              >
                                {orderRowStatusLabel(displayStatus)}
                              </span>
                            </td>
                            <td>{formatShortDate(order.createdAt)}</td>
                            <td>{amount}</td>
                            <td>{amount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="aptus-overview-v3__aside">
              <section
                className="aptus-overview-v3__card aptus-overview-v3__reminders"
                aria-label="Upcoming license renewals"
              >
                <div className="aptus-overview-v3__card-head">
                  <h2>Upcoming Renewals</h2>
                  {renewalReminders.length > 0 ? (
                    <Link href="/portal/subscriptions" className="aptus-overview-v3__link">
                      View all
                    </Link>
                  ) : null}
                </div>

                {renewalReminders.length === 0 ? (
                  <p className="aptus-overview-v3__empty">No license renewals due in the next 90 days.</p>
                ) : (
                  <div className="aptus-overview-v3__reminder-list">
                    {renewalReminders.map((subscription) => {
                      const renewalIso = subscription.renewalDateIso ?? subscription.renewalDate;
                      const urgent = subscription.daysLeft <= 30;

                      return (
                        <Link
                          key={`${subscription.productName}-${renewalIso}-${subscription.lineId ?? subscription.orderId ?? ""}`}
                          href="/portal/subscriptions"
                          className={`aptus-overview-v3__reminder${urgent ? " aptus-overview-v3__reminder--urgent" : ""}`}
                        >
                          <span className="aptus-overview-v3__reminder-icon" aria-hidden="true">
                            <PortalNavIcon name="key" />
                          </span>
                          <span className="aptus-overview-v3__reminder-body">
                            <strong>{subscription.productName}</strong>
                            <span>
                              {formatRenewalReminderLabel(subscription.daysLeft)} ·{" "}
                              {formatShortDate(renewalIso)}
                            </span>
                          </span>
                          {urgent ? (
                            <span className="aptus-overview-v3__reminder-badge">Due soon</span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="aptus-overview-v3__card aptus-overview-v3__quick-actions" aria-label="Quick actions">
                <h2>Quick Actions</h2>
                <div className="aptus-overview-v3__actions">
                  <Link href="/portal/support" className="aptus-overview-v3__action">
                    <PortalNavIcon name="support" />
                    Raise Support Ticket
                  </Link>
                  <Link href="/portal/cart" className="aptus-overview-v3__action">
                    <PortalNavIcon name="box" />
                    Cart
                  </Link>
                  <Link href="/portal/invoices" className="aptus-overview-v3__action">
                    <PortalNavIcon name="invoices" />
                    View Invoices
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

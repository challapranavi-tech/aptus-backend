"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { useOrders } from "@/hooks/useOrders";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  accountTypeLabel,
  buildAccountHealth,
  buildActivityTimeline,
  formatOverviewDate,
  formatShortDate,
  getAccountStatusMessage,
  getGreeting,
} from "@/lib/overview-data";
import type { PortalNotificationStatus } from "@/types/notifications";
import { NotificationCountBadge } from "./NotificationCountBadge";

const SUPPORT_EMAIL = "support@aptusinfotech.com";

const QUICK_ACTIONS = [
  { label: "Browse products", href: "/", description: "Explore software catalog" },
  { label: "Place new order", href: "/portal/purchases", description: "Submit a purchase request" },
  {
    label: "Open support ticket",
    href: `mailto:${SUPPORT_EMAIL}?subject=Aptus%20Portal%20Support`,
    description: "Contact your account team",
  },
  { label: "View orders", href: "/portal/purchases", description: "Track purchase status" },
  { label: "Manage subscriptions", href: "/portal/subscriptions", description: "Licenses and renewals" },
  { label: "Update profile", href: "/portal/profile", description: "Account details" },
] as const;

function notificationStatusClass(status: PortalNotificationStatus): string {
  switch (status) {
    case "Confirmed":
      return "aptus-status--confirmed";
    case "Submitted":
      return "aptus-status--submitted";
    case "Rejected":
      return "aptus-status--expired";
    case "Action Required":
    default:
      return "aptus-status--pending";
  }
}

function HealthMetric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className={`aptus-overview-v2__health-metric aptus-overview-v2__health-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <p>{hint}</p> : null}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  action,
  compact = false,
  children,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`aptus-overview-v2__card${compact ? " aptus-overview-v2__card--compact" : ""}`}
    >
      <div className="aptus-overview-v2__card-head">
        <div>
          <span className="aptus-overview-v2__eyebrow">{eyebrow}</span>
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="aptus-overview-v2__loading" role="status" aria-live="polite">
      <div className="aptus-payment-processing__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
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
  const activities = buildActivityTimeline(allOrders, notifications);
  const statusMessage = getAccountStatusMessage(health, allOrders, notifications);
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const actionRequired = notifications.filter(
    (notification) => notification.status === "Action Required",
  );
  const recentNotifications = notifications.slice(0, 4);

  return (
    <div className="aptus-overview-v2">
      <section className="aptus-overview-v2__welcome" aria-label="Welcome">
        <div>
          <span className="aptus-overview-v2__eyebrow">Account overview</span>
          <h2>
            {getGreeting()}, {user.name.split(" ")[0]}.
          </h2>
          <p>{statusMessage}</p>
        </div>
        <div className="aptus-overview-v2__welcome-meta">
          <span
            className={`aptus-overview-v2__status-pill aptus-overview-v2__status-pill--${health.accountStatus === "Active" ? "good" : "warn"}`}
          >
            {health.accountStatus === "Active" ? "Active account" : "Needs attention"}
          </span>
          {user.customerSince ? (
            <span className="aptus-overview-v2__welcome-note">Customer since {user.customerSince}</span>
          ) : null}
        </div>
      </section>

      <div className="aptus-overview-v2__layout">
        <div className="aptus-overview-v2__main">
          <SectionCard eyebrow="Account" compact>
            {loading ? (
              <LoadingBlock label="Loading account status…" />
            ) : (
              <div className="aptus-overview-v2__health-grid">
                <HealthMetric
                  label="Account"
                  value={health.accountStatus}
                  hint="Overall workspace status"
                  tone={health.accountStatus === "Active" ? "good" : "warn"}
                />
                <HealthMetric
                  label="Profile"
                  value={`${health.profileCompletion}%`}
                  hint="Profile completion"
                  tone={health.profileCompletion >= 80 ? "good" : "warn"}
                />
                <HealthMetric
                  label="Pending"
                  value={String(health.pendingRequests)}
                  hint="Orders and alerts awaiting action"
                  tone={health.pendingRequests > 0 ? "warn" : "good"}
                />
                <HealthMetric
                  label="Verification"
                  value={health.verificationStatus}
                  hint={user.partnerId ? "Linked to Odoo partner" : "Partner link pending"}
                  tone={health.verificationStatus === "Verified" ? "good" : "warn"}
                />
                <HealthMetric
                  label="Subscriptions"
                  value={String(health.activeSubscriptions)}
                  hint="Active licenses on account"
                />
                <HealthMetric
                  label="Renewals due"
                  value={String(health.renewalsDue)}
                  hint="Expiring within planning window"
                  tone={health.renewalsDue > 0 ? "warn" : "neutral"}
                />
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Activity"
            compact
            action={
              <Link href="/portal/purchases" className="aptus-overview-v2__link">
                View all activity
              </Link>
            }
          >
            {loading ? (
              <LoadingBlock label="Loading activity…" />
            ) : activities.length === 0 ? (
              <p className="aptus-overview-v2__empty">No recent activity yet. Place an order to get started.</p>
            ) : (
              <ol className="aptus-overview-v2__timeline">
                {activities.map((activity) => (
                  <li key={activity.id}>
                    <span className="aptus-overview-v2__timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.detail}</p>
                      <time dateTime={activity.timestamp}>{formatOverviewDate(activity.timestamp)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <aside className="aptus-overview-v2__aside">
          <SectionCard
            eyebrow="Support"
            title="Support center"
            description="Reach your account team for product and billing assistance."
            action={
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="aptus-overview-v2__link"
              >
                View support
              </a>
            }
          >
            <div className="aptus-overview-v2__summary-grid aptus-overview-v2__summary-grid--support">
              <div>
                <span>Open tickets</span>
                <strong>{health.openSupportTickets}</strong>
              </div>
              <div>
                <span>Awaiting response</span>
                <strong>{actionRequired.length}</strong>
              </div>
              <div>
                <span>Account manager</span>
                <strong>{user.accountManager || "Aptus Support"}</strong>
              </div>
            </div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="aptus-overview-v2__support-email">
              {SUPPORT_EMAIL}
            </a>
          </SectionCard>

          <SectionCard
            eyebrow="Alerts"
            title="Notifications"
            description="Order updates, subscription events, and account announcements."
            action={
              !loading ? (
                <div className="aptus-overview-v2__card-head-action">
                  {!notificationsLoading && unreadNotifications.length > 0 ? (
                    <NotificationCountBadge count={unreadNotifications.length} active />
                  ) : null}
                  {notifications.length > 0 ? (
                    <Link href="/portal/notifications" className="aptus-overview-v2__link">
                      View all
                    </Link>
                  ) : null}
                </div>
              ) : null
            }
          >
            {loading ? (
              <LoadingBlock label="Loading notifications…" />
            ) : recentNotifications.length === 0 ? (
              <p className="aptus-overview-v2__empty">No notifications right now.</p>
            ) : (
              <ul className="aptus-overview-v2__alerts">
                {recentNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={notification.read ? "" : "aptus-overview-v2__alert--unread"}
                  >
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.detail}</p>
                      <time dateTime={notification.createdAt}>
                        {formatShortDate(notification.createdAt)}
                      </time>
                    </div>
                    <mark className={`aptus-status ${notificationStatusClass(notification.status)}`}>
                      {notification.status}
                    </mark>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard eyebrow="Shortcuts" title="Quick actions" description="Jump to the most-used areas.">
            <div className="aptus-overview-v2__actions">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.label} href={action.href} className="aptus-overview-v2__action">
                  <strong>{action.label}</strong>
                  <span>{action.description}</span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Account" title="Account snapshot" description="Basic profile details at a glance.">
            <dl className="aptus-overview-v2__snapshot">
              <div>
                <dt>Account type</dt>
                <dd>{accountTypeLabel(user)}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{user.company || "—"}</dd>
              </div>
              <div>
                <dt>Contact email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Customer since</dt>
                <dd>{user.customerSince || "—"}</dd>
              </div>
              <div>
                <dt>Support tier</dt>
                <dd>{user.supportTier || "Standard"}</dd>
              </div>
            </dl>
            <Link href="/portal/profile" className="aptus-overview-v2__link">
              Manage profile
            </Link>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatShortDate } from "@/lib/overview-data";
import type { PortalNotificationStatus } from "@/types/notifications";
import { NotificationCountBadge } from "./NotificationCountBadge";

type NotificationFilter = "all" | "unread";

const FILTERS: NotificationFilter[] = ["all", "unread"];

function statusClass(status: PortalNotificationStatus): string {
  switch (status) {
    case "Confirmed":
      return "aptus-status--confirmed";
    case "Submitted":
      return "aptus-status--submitted";
    case "Rejected":
      return "aptus-status--expired";
    case "Action Required":
      return "aptus-status--pending";
    default:
      return "aptus-status--pending";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "order":
      return "Order";
    case "subscription":
      return "Subscription";
    case "renewal":
      return "Renewal";
    default:
      return "General";
  }
}

type NotificationsPanelProps = {
  limit?: number;
};

export function NotificationsPanel({ limit }: NotificationsPanelProps) {
  const { notifications, loading, error } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const isPreview = Boolean(limit);

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }
    return notifications;
  }, [filter, notifications]);

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <section className="aptus-dashboard-card" aria-label="Account notifications">
      <div className="aptus-dashboard-section-head">
        <div>
          <span className="aptus-section__eyebrow">Notifications</span>
          <h2>{isPreview ? "Account alerts" : "All notifications"}</h2>
          <p>
            {isPreview
              ? "Alerts appear here after our team confirms your subscription request."
              : "Order updates, subscription events, renewals, and account announcements."}
          </p>
        </div>
      </div>

      {!isPreview ? (
        <div className="aptus-notifications-tabs" role="tablist" aria-label="Filter notifications">
          {FILTERS.map((item) => {
            const isActive = filter === item;
            const count = item === "all" ? notifications.length : unreadCount;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "is-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All" : "Unread"}
                <NotificationCountBadge count={count} active={isActive} />
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="aptus-odoo-subscriptions__state" role="status" aria-live="polite">
          <div className="aptus-payment-processing__spinner" aria-hidden="true" />
          <p>Loading notifications…</p>
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
            {filter === "all"
              ? "No account alerts right now."
              : "No unread notifications."}
          </p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-portal-list">
          {visible.map((notification) => (
            <article
              key={notification.id}
              className={
                notification.read ? "aptus-notification--read" : "aptus-notification--unread"
              }
            >
              <div className="aptus-notification__body">
                <strong>{notification.title}</strong>
                <p>{notification.detail}</p>
                <div className="aptus-notification-meta">
                  <time dateTime={notification.createdAt}>
                    {formatShortDate(notification.createdAt)}
                  </time>
                  <span>{typeLabel(notification.type)}</span>
                  {notification.reference ? <span>Ref: {notification.reference}</span> : null}
                </div>
              </div>
              <mark className={`aptus-status ${statusClass(notification.status)}`}>
                {notification.status}
              </mark>
            </article>
          ))}
        </div>
      ) : null}

      {isPreview && !loading && notifications.length > (limit ?? 0) ? (
        <div className="aptus-dashboard-section-foot">
          <Link href="/portal/notifications">View all notifications</Link>
        </div>
      ) : null}
    </section>
  );
}

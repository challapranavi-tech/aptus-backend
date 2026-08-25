"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  notificationStatusClass,
  notificationStatusLabel,
} from "@/lib/notification-status";
import { formatShortDate } from "@/lib/overview-data";

function typeLabel(type: string): string {
  switch (type) {
    case "order":
      return "Order";
    case "subscription":
      return "Subscription";
    case "renewal":
      return "Renewal";
    case "payment_failed":
      return "Payment";
    case "cancellation":
      return "Cancellation";
    case "license_expired":
      return "License";
    case "refund_requested":
    case "refund_processed":
      return "Refund";
    default:
      return "General";
  }
}

function typeHref(type: string): string {
  switch (type) {
    case "order":
    case "payment_failed":
    case "refund_requested":
    case "refund_processed":
      return "/portal/orders";
    case "subscription":
    case "renewal":
    case "cancellation":
    case "license_expired":
      return "/portal/subscriptions";
    default:
      return "/portal/dashboard";
  }
}

type NotificationsPanelProps = {
  limit?: number;
};

export function NotificationsPanel({ limit }: NotificationsPanelProps) {
  const { notifications, loading, error, markRead } = useNotifications();
  const isPreview = Boolean(limit);
  // Full notifications page: mark unread as read once they are on screen — no Click CTA.
  const markingRef = useRef(false);

  const visible = limit ? notifications.slice(0, limit) : notifications;

  useEffect(() => {
    if (isPreview || loading || markingRef.current) return;
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);
    if (!unreadIds.length) return;
    markingRef.current = true;
    void markRead(unreadIds).finally(() => {
      markingRef.current = false;
    });
  }, [isPreview, loading, notifications, markRead]);

  return (
    <section className="aptus-portal-page-card" aria-label="Account notifications">
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
          <p>No account alerts right now.</p>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="aptus-portal-list">
          {visible.map((notification) => (
            <Link
              key={notification.id}
              href={typeHref(notification.type)}
              className={
                notification.read
                  ? "aptus-notification aptus-notification--read"
                  : "aptus-notification aptus-notification--unread"
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
              <mark
                className={`aptus-status ${notificationStatusClass(notification.status, notification.type)}`}
              >
                {notificationStatusLabel(notification.status, notification.type)}
              </mark>
            </Link>
          ))}
        </div>
      ) : null}

      {isPreview && !loading && notifications.length > (limit ?? 0) ? (
        <div className="aptus-dashboard-section-foot">
          <Link href="/portal/notifications" className="aptus-overview-compact__link">
            View all notifications
          </Link>
        </div>
      ) : null}
    </section>
  );
}

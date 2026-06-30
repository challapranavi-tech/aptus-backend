"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrdersPanel } from "./OrdersPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { SubscriptionsPanel } from "./SubscriptionsPanel";
import { OverviewDashboard } from "./OverviewDashboard";
import { PortalLegacyContent } from "./PortalLegacyContent";
import { useAuth } from "@/context/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { useOrders } from "@/hooks/useOrders";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { listenPortalDataChanged } from "@/lib/portal-data-events";
import { NotificationCountBadge } from "./NotificationCountBadge";

type Section =
  | "dashboard"
  | "purchases"
  | "subscriptions"
  | "renewals"
  | "notifications"
  | "profile";

const NAV: { section: Section; href: string; label: string; title: string }[] = [
  { section: "dashboard", href: "/portal/dashboard", label: "Overview", title: "Dashboard Overview" },
  { section: "purchases", href: "/portal/purchases", label: "Purchases", title: "Purchases" },
  { section: "subscriptions", href: "/portal/subscriptions", label: "Subscriptions", title: "Subscriptions" },
  { section: "renewals", href: "/portal/renewals", label: "Renewals", title: "Renewals" },
  {
    section: "notifications",
    href: "/portal/notifications",
    label: "Notifications",
    title: "Notifications",
  },
  { section: "profile", href: "/portal/profile", label: "Profile", title: "Profile" },
];

export function PortalDashboardShell({
  section,
}: {
  section: Section;
}) {
  const current = NAV.find((n) => n.section === section) ?? NAV[0];
  const [legacyRefreshKey, setLegacyRefreshKey] = useState(0);
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { subscriptions, loading: subscriptionsLoading } = useSubscriptions();
  const { notifications } = useNotifications();
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    return listenPortalDataChanged(() => {
      setLegacyRefreshKey((key) => key + 1);
    });
  }, []);

  useEffect(() => {
    if (subscriptionsLoading) {
      return;
    }
    window.aptusPortalAuth?.setSubscriptions?.(subscriptions);
  }, [subscriptions, subscriptionsLoading]);

  async function handleLogout() {
    try {
      if (window.aptusPortalAuth?.logout) {
        await window.aptusPortalAuth.logout();
        return;
      }
      await logout();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  return (
    <div
      id="wrap"
      className="aptus-site aptus-customer-dashboard"
      data-aptus-dashboard-page="true"
      data-aptus-dashboard-section={section}
    >
      <main className="aptus-dashboard-shell">
        <aside className="aptus-dashboard-sidebar" aria-label="Customer dashboard navigation">
          <div className="aptus-dashboard-user" aria-label="Signed in customer">
            <span
              className="aptus-dashboard-user__avatar"
              data-aptus-bind="initials"
              data-aptus-avatar="true"
            >
              AI
            </span>
            <div>
              <strong data-aptus-bind="userName">
                Customer
              </strong>
              <p data-aptus-bind="company">Aptus account</p>
            </div>
          </div>
          <nav className="aptus-dashboard-nav">
            {NAV.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                data-aptus-section-link={item.section}
              >
                {item.label}
                {item.section === "notifications" ? (
                  <NotificationCountBadge count={unreadNotificationCount} active />
                ) : null}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="aptus-dashboard-sidebar__logout"
            data-aptus-logout="true"
            onClick={() => void handleLogout()}
          >
            Logout
          </button>
        </aside>

        <section className="aptus-dashboard-main">
          <header className="aptus-dashboard-topbar">
            <div className="aptus-dashboard-topbar__copy">
              <span className="aptus-section__eyebrow">Customer Workspace</span>
              <h1>{current.title}</h1>
              {section !== "dashboard" ? (
                <p data-aptus-bind="welcomeText">Loading customer workspace...</p>
              ) : null}
            </div>
          </header>
          <div className="aptus-dashboard-mobile-nav" aria-label="Dashboard quick navigation">
            {NAV.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                data-aptus-section-link={item.section}
              >
                {item.label}
                {item.section === "notifications" ? (
                  <NotificationCountBadge count={unreadNotificationCount} active />
                ) : null}
              </Link>
            ))}
          </div>

          {section === "dashboard" ? (
            <OverviewDashboard />
          ) : (
            <>
              {section === "purchases" && (
                <OrdersPanel
                  orders={orders}
                  loading={ordersLoading}
                  error={ordersError}
                />
              )}
              <PortalLegacyContent refreshToken={legacyRefreshKey} />
              {(section === "subscriptions" || section === "renewals") && (
                <SubscriptionsPanel
                  statusFilter={section === "renewals" ? "Expiring Soon" : "all"}
                />
              )}
              {section === "notifications" && <NotificationsPanel />}
            </>
          )}
        </section>
      </main>

      <div className="preview-banner">
        <strong>Client-side demo portal</strong>
      </div>
    </div>
  );
}

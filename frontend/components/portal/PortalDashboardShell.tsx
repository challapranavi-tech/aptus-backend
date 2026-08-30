"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartCheckoutPanel } from "./CartCheckoutPanel";
import { SoftwarePurchasePanel } from "./SoftwarePurchasePanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { SubscriptionsPanel } from "./SubscriptionsPanel";
import { OverviewDashboard } from "./OverviewDashboard";
import { ProfilePanel } from "./ProfilePanel";
import { OrdersSection } from "./OrdersSection";
import { InvoicesPanel } from "./InvoicesPanel";
import { SupportPanel } from "./SupportPanel";
import { HelpVideosPanel } from "./HelpVideosPanel";
import { PortalNavIcon } from "./PortalNavIcon";
import { PortalSideNav, type PortalNavEntry } from "./PortalSideNav";
import { useAuth } from "@/context/AuthProvider";
import { getPortalUserFromStorage } from "@/lib/portal-session";
import { useNotifications } from "@/hooks/useNotifications";
import { usePortalCartCount } from "@/hooks/usePortalCartCount";
import { useOrders } from "@/hooks/useOrders";
import { NotificationCountBadge } from "./NotificationCountBadge";

type Section =
  | "dashboard"
  | "products"
  | "cart"
  | "subscriptions"
  | "orders"
  | "invoices"
  | "licenses"
  | "videos"
  | "notifications"
  | "support"
  | "profile";

type NavMeta = {
  section: Section;
  title: string;
  sub: string;
};

const NAV_ITEMS: PortalNavEntry[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/portal/products", label: "Products", icon: "box" },
  { href: "/portal/cart", label: "Cart", icon: "cart" },
  { href: "/portal/orders", label: "Orders", icon: "orders" },
  { href: "/portal/invoices", label: "Invoices", icon: "invoices" },
  {
    href: "/portal/subscriptions",
    label: "Licenses & Subscriptions",
    icon: "key",
    matchHrefs: ["/portal/licenses", "/portal/renewals"],
  },
  { href: "/portal/videos", label: "Help videos", icon: "videos" },
  { href: "/portal/profile", label: "Profile", icon: "profile", dividerBefore: true },
];

const SECTION_META: Record<Section, NavMeta> = {
  dashboard: {
    section: "dashboard",
    title: "Dashboard",
    sub: "Everything you need to manage your software, licenses and orders.",
  },
  products: {
    section: "products",
    title: "Products",
    sub: "Browse and buy software licenses.",
  },
  cart: {
    section: "cart",
    title: "Cart",
    sub: "Review items before checkout.",
  },
  orders: {
    section: "orders",
    title: "Orders",
    sub: "All orders, most recent first.",
  },
  invoices: {
    section: "invoices",
    title: "Invoices",
    sub: "Download invoices for your records.",
  },
  subscriptions: {
    section: "subscriptions",
    title: "Licenses & Subscriptions",
    sub: "Manage active subscriptions, renewals, upgrades, and cancellations.",
  },
  licenses: {
    section: "licenses",
    title: "Licenses & Subscriptions",
    sub: "Manage active subscriptions, renewals, upgrades, and cancellations.",
  },
  videos: {
    section: "videos",
    title: "Help videos",
    sub: "Short videos to help you get more from your products.",
  },
  notifications: {
    section: "notifications",
    title: "Notifications",
    sub: "Updates about renewals, licenses, and orders.",
  },
  support: {
    section: "support",
    title: "Support",
    sub: "Raise and track support tickets.",
  },
  profile: {
    section: "profile",
    title: "Profile",
    sub: "Your account details.",
  },
};

export function PortalDashboardShell({
  section,
  children,
}: {
  section: Section;
  children?: React.ReactNode;
}) {
  const current = SECTION_META[section] ?? SECTION_META.dashboard;

  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const { allOrders } = useOrders();
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;
  const cartCount = usePortalCartCount();
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const stored = getPortalUserFromStorage();
    setAvatarDataUrl(stored?.avatarDataUrl);
  }, [user?.id]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.href = "/login";
    }
  };

  const workspaceName = user?.company || user?.name || "Aptus workspace";
  const ordersSub =
    section === "orders"
      ? `All ${allOrders.length} orders, most recent first.`
      : current.sub;

  const sectionBody =
    section === "dashboard" ? (
      <OverviewDashboard />
    ) : children ? (
      children
    ) : (
      <>
        {section === "products" && <SoftwarePurchasePanel />}
        {section === "cart" && <CartCheckoutPanel />}
        {section === "subscriptions" && <SubscriptionsPanel statusFilter="all" />}
        {section === "orders" && <OrdersSection />}
        {section === "invoices" && <InvoicesPanel />}
        {section === "licenses" && <SubscriptionsPanel statusFilter="all" licenseView />}
        {section === "videos" && <HelpVideosPanel />}
        {section === "notifications" && <NotificationsPanel />}
        {section === "support" && <SupportPanel />}
        {section === "profile" && <ProfilePanel />}
      </>
    );

  return (
    <div
      id="wrap"
      className="aptus-site aptus-customer-dashboard aptus-portal-v3 aptus-portal-compact"
      data-aptus-dashboard-page="true"
      data-aptus-dashboard-section={section}
    >
      <main className="aptus-dashboard-shell">
        <aside className="aptus-dashboard-sidebar" aria-label="Customer dashboard navigation">
          <Link href="/portal/dashboard" className="aptus-portal-compact__brand">
            {workspaceName}
          </Link>

          <PortalSideNav
            items={NAV_ITEMS}
            label="Customer portal"
            renderTrailing={(href) =>
              href === "/portal/cart" ? (
                <NotificationCountBadge count={cartCount} active />
              ) : null
            }
          />

          <button
            type="button"
            className="aptus-dashboard-sidebar__logout"
            data-aptus-logout="true"
            disabled={loggingOut}
            onClick={() => {
              void handleLogout();
            }}
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </aside>

        <section className="aptus-dashboard-main">
          <header className="aptus-portal-v3__header aptus-portal-compact__topbar">
            <div className="aptus-portal-v3__header-copy">
              <h1>{current.title}</h1>
              <p>{ordersSub}</p>
            </div>

            <div className="aptus-portal-v3__header-actions">
              <Link
                href="/portal/support"
                className="aptus-portal-v3__icon-btn"
                aria-label="Support"
                title="Support"
              >
                <PortalNavIcon name="support" className="aptus-portal-v3__header-icon" />
              </Link>
              <Link
                href="/portal/notifications"
                className="aptus-portal-v3__icon-btn"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
              >
                <PortalNavIcon name="bell" className="aptus-portal-v3__header-icon" />
                {unreadNotificationCount > 0 ? <span className="aptus-portal-v3__bell-dot" /> : null}
              </Link>
              <Link
                href="/portal/profile"
                className="aptus-portal-compact__avatar-link"
                aria-label="Profile"
                title="Profile"
              >
                {avatarDataUrl ? (
                  <span
                    className="aptus-portal-compact__top-avatar has-image"
                    style={{ backgroundImage: `url('${avatarDataUrl}')` }}
                    aria-hidden
                  />
                ) : (
                  <span className="aptus-portal-compact__top-avatar" aria-hidden>
                    {user?.initials || "—"}
                  </span>
                )}
              </Link>
              <button
                type="button"
                className="aptus-portal-v3__icon-btn aptus-portal-v3__logout-btn"
                data-aptus-logout="true"
                aria-label={loggingOut ? "Signing out" : "Logout"}
                title="Logout"
                disabled={loggingOut}
                onClick={() => {
                  void handleLogout();
                }}
              >
                <PortalNavIcon name="logout" className="aptus-portal-v3__header-icon" />
              </button>
            </div>
          </header>

          <div className="aptus-dashboard-mobile-nav" aria-label="Dashboard quick navigation">
            <PortalSideNav
              items={NAV_ITEMS}
              label="Customer portal quick navigation"
              horizontal
              renderTrailing={(href) =>
                href === "/portal/cart" ? (
                  <NotificationCountBadge count={cartCount} active />
                ) : null
              }
            />
          </div>

          {sectionBody}
        </section>
      </main>
    </div>
  );
}

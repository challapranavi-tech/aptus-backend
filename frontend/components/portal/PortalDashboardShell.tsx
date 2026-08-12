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
import { PortalNavIcon } from "./PortalNavIcon";
import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import type { SoftwareSubNavLink } from "@/data/software-subnav";
import { useAuth } from "@/context/AuthProvider";
import { getPortalUserFromStorage } from "@/lib/portal-session";
import { useNotifications } from "@/hooks/useNotifications";
import { usePortalCartCount } from "@/hooks/usePortalCartCount";
import { NotificationCountBadge } from "./NotificationCountBadge";

type Section =
  | "dashboard"
  | "products"
  | "cart"
  | "subscriptions"
  | "orders"
  | "invoices"
  | "licenses"
  | "notifications"
  | "support"
  | "profile";

type NavItem = {
  section: Section;
  href: string;
  label: string;
  title: string;
};

const NAV: NavItem[] = [
  { section: "dashboard", href: "/portal/dashboard", label: "Dashboard", title: "Dashboard" },
  { section: "products", href: "/portal/products", label: "Products", title: "Products" },
  { section: "cart", href: "/portal/cart", label: "Cart", title: "Shopping Cart" },
  {
    section: "subscriptions",
    href: "/portal/subscriptions",
    label: "Subscription & Renews",
    title: "Subscription & Renews",
  },
  { section: "orders", href: "/portal/orders", label: "Orders", title: "Orders" },
  { section: "invoices", href: "/portal/invoices", label: "Invoice", title: "Invoices" },
  // { section: "licenses", href: "/portal/licenses", label: "License", title: "Licenses" },
  { section: "notifications", href: "/portal/notifications", label: "Notifications", title: "Notifications" },
  { section: "support", href: "/portal/support", label: "Support Tickets", title: "Support Tickets" },
  { section: "profile", href: "/portal/profile", label: "Profile", title: "Profile" },
];

const PORTAL_NAV_LINKS: SoftwareSubNavLink[] = NAV.map(({ label, href }) => ({ label, href }));

function navTrailingBadge(
  link: SoftwareSubNavLink,
  unreadNotificationCount: number,
  cartCount: number,
) {
  if (link.href === "/portal/notifications") {
    return <NotificationCountBadge count={unreadNotificationCount} active />;
  }
  if (link.href === "/portal/cart") {
    return <NotificationCountBadge count={cartCount} active />;
  }
  return null;
}

export function PortalDashboardShell({
  section,
  children,
}: {
  section: Section;
  children?: React.ReactNode;
}) {
  const current = NAV.find((item) => item.section === section) ?? NAV[0];

  const { user } = useAuth();
  const { notifications } = useNotifications();
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;
  const cartCount = usePortalCartCount();
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();

  useEffect(() => {
    const stored = getPortalUserFromStorage();
    setAvatarDataUrl(stored?.avatarDataUrl);
  }, [user?.id]);

  const firstName = user?.name?.split(" ")[0] ?? "Customer";

  return (
    <div
      id="wrap"
      className="aptus-site aptus-customer-dashboard aptus-portal-v3"
      data-aptus-dashboard-page="true"
      data-aptus-dashboard-section={section}
    >
      <main className="aptus-dashboard-shell">
        <aside className="aptus-dashboard-sidebar" aria-label="Customer dashboard navigation">
          <Link href="/portal/profile" className="aptus-dashboard-user aptus-portal-v3__user" aria-label="Your profile">
            {avatarDataUrl ? (
              <span
                className="aptus-dashboard-user__avatar has-image"
                style={{ backgroundImage: `url('${avatarDataUrl}')` }}
                aria-hidden
              />
            ) : (
              <span className="aptus-dashboard-user__avatar" data-aptus-avatar="true" aria-hidden>
                {user?.initials || "—"}
              </span>
            )}
            <div>
              <strong>{user?.name || "Customer"}</strong>
              <p>{user?.company || "Aptus account"}</p>
            </div>
          </Link>

          <SoftwareSubNav
            links={PORTAL_NAV_LINKS}
            label="Customer portal"
            matchPrefix
            renderTrailing={(link) => navTrailingBadge(link, unreadNotificationCount, cartCount)}
          />
        </aside>

        <section className="aptus-dashboard-main">
          <header className="aptus-portal-v3__header">
            <div className="aptus-portal-v3__header-copy">
              {section === "dashboard" ? (
                <>
                  <h1>Welcome {firstName}!</h1>
                  <p>Your digital workspace</p>
                </>
              ) : (
                <>
                  <h1>{current.title}</h1>
                  <p>Signed in as {user?.name || "your account"}</p>
                </>
              )}
            </div>

            <div className="aptus-portal-v3__header-actions">
              <Link
                href="/portal/notifications"
                className="aptus-portal-v3__icon-btn"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
              >
                <PortalNavIcon name="bell" className="aptus-portal-v3__header-icon" />
                {unreadNotificationCount > 0 ? <span className="aptus-portal-v3__bell-dot" /> : null}
              </Link>
            </div>
          </header>

          <div className="aptus-dashboard-mobile-nav" aria-label="Dashboard quick navigation">
            <SoftwareSubNav
              links={PORTAL_NAV_LINKS}
              label="Customer portal quick navigation"
              matchPrefix
              horizontal
              renderTrailing={(link) => navTrailingBadge(link, unreadNotificationCount, cartCount)}
            />
          </div>

          {section === "dashboard" ? (
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
              {section === "licenses" && (
                <SubscriptionsPanel statusFilter="all" licenseView />
              )}
              {section === "notifications" && <NotificationsPanel />}
              {section === "support" && <SupportPanel />}
              {section === "profile" && <ProfilePanel />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

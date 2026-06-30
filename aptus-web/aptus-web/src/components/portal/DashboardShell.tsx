"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getInitials } from "@/lib/auth";
import { useAuth } from "@/context/AuthProvider";

const NAV = [
  { href: "/portal/dashboard", label: "Overview", section: "dashboard" },
  { href: "/portal/purchases", label: "Purchases", section: "purchases" },
  { href: "/portal/subscriptions", label: "Subscriptions", section: "subscriptions" },
  { href: "/portal/renewals", label: "Renewals", section: "renewals" },
  { href: "/portal/profile", label: "Profile", section: "profile" },
] as const;

const SUPPORT_EMAIL = "support@aptusinfotech.com";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
        Loading workspace…
      </div>
    );
  }

  const activeSection =
    NAV.find((item) => pathname.startsWith(item.href))?.section ?? "dashboard";

  return (
    <div className="aptus-portal">
      <header className="aptus-portal-navbar">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-white">
            Aptus Infotech
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-white/80 hover:text-white">
              Public site
            </Link>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => router.push("/login"));
              }}
              className="rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="aptus-dashboard-shell">
        <aside className="aptus-dashboard-sidebar">
          <div className="aptus-dashboard-user">
            <span className="aptus-dashboard-user__avatar">{getInitials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <p>{user.company}</p>
            </div>
          </div>

          <nav className="aptus-dashboard-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={activeSection === item.section ? "is-active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="aptus-dashboard-sidebar__card">
            <span>Account Manager</span>
            <strong>{user.accountManager}</strong>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </div>
        </aside>

        <section className="aptus-dashboard-main">{children}</section>
      </div>

      <div className="aptus-preview-banner">
        <strong>Secure customer portal</strong> — RS256 JWT with refresh token rotation.
      </div>
    </div>
  );
}

export function DashboardTopbar({
  title,
  welcomeText,
}: {
  title: string;
  welcomeText: string;
}) {
  return (
    <header className="aptus-dashboard-topbar">
      <div className="aptus-dashboard-topbar__copy">
        <span className="aptus-section-eyebrow">Customer Workspace</span>
        <h1>{title}</h1>
        <p>{welcomeText}</p>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="aptus-dashboard-mobile-nav">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname.startsWith(item.href) ? "is-active" : ""}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

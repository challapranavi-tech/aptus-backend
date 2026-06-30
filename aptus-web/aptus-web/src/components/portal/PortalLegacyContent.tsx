"use client";

import { useEffect } from "react";

type PortalLegacyContentProps = {
  /** Re-inject legacy portal HTML when this value changes. */
  refreshToken?: string | number | boolean;
};

function syncLegacyDashboardContent(fullRefresh = false) {
  if (fullRefresh) {
    const refreshPortal = window.aptusPortalAuth?.refreshPortal;
    if (refreshPortal) {
      void Promise.resolve(refreshPortal()).catch(() => undefined);
      return;
    }
  }

  const refreshViews = window.aptusPortalAuth?.refreshDashboardViews;
  if (refreshViews) {
    refreshViews();
    return;
  }

  const refreshPortal = window.aptusPortalAuth?.refreshPortal;
  if (refreshPortal) {
    void Promise.resolve(refreshPortal()).catch(() => undefined);
  }
}

/** Mount point for aptus_portal_auth.js dashboard HTML (metrics, purchase flow, etc.). */
export function PortalLegacyContent({ refreshToken }: PortalLegacyContentProps) {
  useEffect(() => {
    syncLegacyDashboardContent(true);

    if (!window.aptusPortalAuth?.refreshDashboardViews) {
      const onReady = () => syncLegacyDashboardContent(true);
      window.addEventListener("aptus:portal-ready", onReady, { once: true });
      return () => window.removeEventListener("aptus:portal-ready", onReady);
    }
  }, []);

  useEffect(() => {
    if (refreshToken === undefined) {
      return;
    }
    syncLegacyDashboardContent();
  }, [refreshToken]);

  return (
    <div
      className="aptus-dashboard-content"
      data-aptus-dashboard-content="true"
      suppressHydrationWarning
    />
  );
}

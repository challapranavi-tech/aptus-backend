"use client";

import Script from "next/script";

/**
 * Bootstrap JS for portal modals/dropdowns.
 * Legacy aptus_portal_auth.js / portal-config.js are not shipped in this module —
 * React portal components own that behaviour now.
 */
export function PortalScripts() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      strategy="afterInteractive"
      onError={() => {
        /* optional CDN script */
      }}
    />
  );
}

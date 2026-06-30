"use client";

import Script from "next/script";

export function PortalScripts() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
        onError={() => {
          /* optional CDN script — avoid unhandled rejection surfacing as [object Event] */
        }}
      />
      <Script src="/js/portal-config.js" strategy="afterInteractive" />
      <Script src="/js/aptus_portal_auth.js" strategy="afterInteractive" />
    </>
  );
}

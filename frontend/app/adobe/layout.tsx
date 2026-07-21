import type { ReactNode } from "react";

/** Adobe Clean fonts via Typekit — falls back to Trebuchet/Arial Black in CSS. */
export default function AdobeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://use.typekit.net/dnj6pcl.css" />
      {children}
    </>
  );
}

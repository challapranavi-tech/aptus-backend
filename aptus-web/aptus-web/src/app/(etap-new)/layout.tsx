import { Footer } from "@/components/layout/Footer";

/**
 * ETAP New route group — uses Aptus footer only (no standard site header).
 * Keeps /etap_new independent from the (site) layout.
 */
export default function EtapNewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main id="content">{children}</main>
      <Footer />
    </>
  );
}

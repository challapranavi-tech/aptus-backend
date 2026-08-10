import { AuthProvider } from "@/context/AuthProvider";
import { PortalAuthGuard } from "@/components/portal/PortalAuthGuard";
import { PortalStyles } from "@/components/portal/PortalStyles";
import { PortalScripts } from "@/components/portal/PortalScripts";

/**
 * Portal-only chrome: auth context, styles, and route guard.
 * Kept out of root layout so marketing pages never load portal session UI.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalStyles />
      <AuthProvider>
        <PortalAuthGuard>{children}</PortalAuthGuard>
      </AuthProvider>
      <PortalScripts />
    </>
  );
}

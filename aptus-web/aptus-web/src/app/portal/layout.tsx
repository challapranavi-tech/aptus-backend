import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PortalAuthGuard } from "@/components/portal/PortalAuthGuard";
import { PortalPageInit } from "@/components/portal/PortalPageInit";
import { PortalProviders } from "@/components/portal/PortalProviders";
import { PortalStyles } from "@/components/portal/PortalStyles";
import { PortalScripts } from "@/components/portal/PortalScripts";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalStyles />
      <Header />
      <PortalAuthGuard>
        <PortalProviders>
          <PortalPageInit />
          {children}
        </PortalProviders>
      </PortalAuthGuard>
      <Footer />
      <PortalScripts />
    </>
  );
}

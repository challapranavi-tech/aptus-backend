import { Header } from "@/components/layout/Header";
import { PortalPageInit } from "@/components/portal/PortalPageInit";
import { PortalStyles } from "@/components/portal/PortalStyles";
import { PortalScripts } from "@/components/portal/PortalScripts";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalStyles />
      <Header />
      <PortalPageInit />
      {children}
      <PortalScripts />
    </>
  );
}

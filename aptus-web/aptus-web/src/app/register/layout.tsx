import { Header } from "@/components/layout/Header";
import { PortalPageInit } from "@/components/portal/PortalPageInit";
import { PortalStyles } from "@/components/portal/PortalStyles";
import { PortalScripts } from "@/components/portal/PortalScripts";

export const metadata = {
  title: "Register | Aptus Infotech",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
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

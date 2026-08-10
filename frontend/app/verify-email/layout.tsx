import { PortalStyles } from "@/components/portal/PortalStyles";
import { PortalScripts } from "@/components/portal/PortalScripts";

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalStyles />
      {children}
      <PortalScripts />
    </>
  );
}

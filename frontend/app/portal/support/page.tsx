import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Support Tickets | Aptus Customer Portal" });
}

export default function SupportPage() {
  return <PortalDashboardShell section="support" />;
}

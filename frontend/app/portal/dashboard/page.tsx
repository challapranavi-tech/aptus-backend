import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Dashboard Overview | Aptus Customer Portal" });
}

export default function DashboardPage() {
  return <PortalDashboardShell section="dashboard" />;
}

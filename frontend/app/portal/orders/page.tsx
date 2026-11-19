import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Orders | Aptus Customer Portal" });
}

export default function OrdersPage() {
  return <PortalDashboardShell section="orders" />;
}

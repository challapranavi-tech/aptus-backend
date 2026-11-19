import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Subscriptions | Aptus Customer Portal" });
}

export default function SubscriptionsPage() {
  return <PortalDashboardShell section="subscriptions" />;
}

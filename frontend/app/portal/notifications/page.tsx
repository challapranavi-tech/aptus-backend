import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Notifications | Aptus Customer Portal" });
}

export default function NotificationsPage() {
  return <PortalDashboardShell section="notifications" />;
}

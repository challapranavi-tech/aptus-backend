import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Profile | Aptus Customer Portal" });
}

export default function ProfilePage() {
  return <PortalDashboardShell section="profile" />;
}

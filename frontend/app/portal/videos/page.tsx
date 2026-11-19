import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Help videos | Aptus Customer Portal" });
}

export default function HelpVideosPage() {
  return <PortalDashboardShell section="videos" />;
}

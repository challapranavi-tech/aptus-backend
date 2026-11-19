import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Invoices | Aptus Customer Portal" });
}

export default function InvoicesPage() {
  return <PortalDashboardShell section="invoices" />;
}

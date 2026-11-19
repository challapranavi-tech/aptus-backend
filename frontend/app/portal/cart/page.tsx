import { PortalDashboardShell } from "@/components/portal/PortalDashboardShell";
import { withArabicMeta } from "@/lib/arabic-meta";

export function generateMetadata() {
  return withArabicMeta({ title: "Shopping Cart | Aptus Customer Portal" });
}

export default function CartPage() {
  return <PortalDashboardShell section="cart" />;
}

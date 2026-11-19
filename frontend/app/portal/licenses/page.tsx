import { withArabicMeta } from "@/lib/arabic-meta";
import { redirect } from "next/navigation";

export function generateMetadata() {
  return withArabicMeta({ title: "Licenses | Aptus Customer Portal" });
}

/** Keep /portal/licenses as an alias of Licenses & Subscriptions. */
export default function LicensesPage() {
  redirect("/portal/subscriptions");
}

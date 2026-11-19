import { withArabicMeta } from "@/lib/arabic-meta";
import { redirect } from "next/navigation";

export function generateMetadata() {
  return withArabicMeta({ title: "Renewals | Aptus Customer Portal" });
}

/** Legacy /portal/renewals URL → Subscription & Renews. */
export default function RenewalsRedirectPage() {
  redirect("/portal/subscriptions");
}

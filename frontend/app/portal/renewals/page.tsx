import { redirect } from "next/navigation";

export const metadata = { title: "Renewals | Aptus Customer Portal" };

/** Legacy /portal/renewals URL → Subscription & Renews. */
export default function RenewalsRedirectPage() {
  redirect("/portal/subscriptions");
}

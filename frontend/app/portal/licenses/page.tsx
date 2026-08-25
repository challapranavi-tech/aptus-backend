import { redirect } from "next/navigation";

export const metadata = { title: "Licenses | Aptus Customer Portal" };

/** Keep /portal/licenses as an alias of Licenses & Subscriptions. */
export default function LicensesPage() {
  redirect("/portal/subscriptions");
}

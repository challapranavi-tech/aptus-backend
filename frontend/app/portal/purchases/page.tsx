import { redirect } from "next/navigation";

export const metadata = { title: "Products | Aptus Customer Portal" };

/** Legacy /portal/purchases URL → Products. */
export default function PurchasesRedirectPage() {
  redirect("/software-solutions/products");
}

import { withArabicMeta } from "@/lib/arabic-meta";
import { redirect } from "next/navigation";

export function generateMetadata() {
  return withArabicMeta({ title: "Products | Aptus Customer Portal" });
}

/** Legacy /portal/purchases URL → Products. */
export default function PurchasesRedirectPage() {
  redirect("/software-solutions/products");
}

import { withArabicMeta } from "@/lib/arabic-meta";
import { redirect } from "next/navigation";

export function generateMetadata() {
  return withArabicMeta({ title: "Products | Aptus Customer Portal" });
}

/** Unified product catalog lives on the public software products page. */
export default function ProductsPage() {
  redirect("/software-solutions/products");
}

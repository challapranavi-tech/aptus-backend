import { redirect } from "next/navigation";

export const metadata = { title: "Products | Aptus Customer Portal" };

/** Unified product catalog lives on the public software page. */
export default function ProductsPage() {
  redirect("/software-solutions");
}

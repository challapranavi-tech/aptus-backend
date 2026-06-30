import { jsonOk } from "@/lib/server/http";
import { listAutodeskProducts } from "@/lib/server/odoo/autodesk-products";
import { AUTODESK_CATEGORY_LABELS } from "@/types/autodesk-product";
import type { AutodeskProductCategory } from "@/types/autodesk-product";

const CATEGORIES: AutodeskProductCategory[] = [
  "engineering_design",
  "aec_bim",
  "water_infrastructure",
];

export async function GET() {
  const products = await listAutodeskProducts();

  const categories = CATEGORIES.map((id) => ({
    id,
    label: AUTODESK_CATEGORY_LABELS[id],
    productCount: products.filter((product) => product.category === id).length,
  }));

  return jsonOk({ categories });
}

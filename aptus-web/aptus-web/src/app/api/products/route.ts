import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/server/http";
import { listAutodeskProducts } from "@/lib/server/odoo/autodesk-products";
import type { AutodeskProductCategory } from "@/types/autodesk-product";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") as AutodeskProductCategory | null;
  const validCategories: AutodeskProductCategory[] = [
    "engineering_design",
    "aec_bim",
    "water_infrastructure",
  ];

  const products = await listAutodeskProducts(
    category && validCategories.includes(category) ? category : undefined,
  );

  return jsonOk({ products, count: products.length });
}

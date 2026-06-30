import { jsonError, jsonOk } from "@/lib/server/http";
import { fetchAutodeskProductBySlug } from "@/lib/server/odoo/autodesk-products";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const product = await fetchAutodeskProductBySlug(slug);

  if (!product) {
    return jsonError("Product not found", 404);
  }

  return jsonOk({ product });
}

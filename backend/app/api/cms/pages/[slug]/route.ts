import { getPageBySlug } from "@/data";
import { validationError } from "@/lib/api-validate";
import { parseCmsSlug } from "@shared/lib/cms-slug";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/cms/pages/[slug]
 *
 * security (OWASP API1): `slug` is an object identifier. Authorization is
 * enforced in OdooClient.loadPageBySlug (website scope + published only).
 * Missing and unpublished pages both return 404 — do not reveal drafts.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug: rawSlug } = await params;
  const parsed = parseCmsSlug(rawSlug);
  if (!parsed.ok) return validationError(parsed.errors);

  const { slug } = parsed.data;
  try {
    const page = await getPageBySlug(slug);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (err) {
    console.error("[cms/pages] failed:", err);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}

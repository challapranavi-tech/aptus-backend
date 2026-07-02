import { getPageBySlug } from "@/data";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const page = await getPageBySlug(slug);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load page", detail: String(err) },
      { status: 500 },
    );
  }
}

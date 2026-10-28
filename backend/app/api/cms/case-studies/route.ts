import { getCaseStudiesPageContent } from "@/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const content = await getCaseStudiesPageContent();
    if (!content) {
      return NextResponse.json({ error: "Case studies content not found" }, { status: 404 });
    }
    return NextResponse.json(content);
  } catch (err) {
    console.error("[cms/case-studies] failed:", err);
    return NextResponse.json({ error: "Failed to load case studies" }, { status: 500 });
  }
}

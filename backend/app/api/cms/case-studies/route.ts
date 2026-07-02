import { loadCaseStudiesPageContent } from "@/lib/case-studies-page-content";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const content = loadCaseStudiesPageContent();
    if (!content) {
      return NextResponse.json({ error: "Case studies content not found" }, { status: 404 });
    }
    return NextResponse.json(content);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load case studies", detail: String(err) },
      { status: 500 },
    );
  }
}

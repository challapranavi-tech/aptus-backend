import { getAllPageSlugs } from "@/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const slugs = await getAllPageSlugs();
    return NextResponse.json({ slugs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load slugs", detail: String(err) },
      { status: 500 },
    );
  }
}

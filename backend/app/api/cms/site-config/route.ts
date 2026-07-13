import { getSiteConfig } from "@/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (err) {
    console.error("[cms/site-config] failed:", err);
    return NextResponse.json({ error: "Failed to load site config" }, { status: 500 });
  }
}

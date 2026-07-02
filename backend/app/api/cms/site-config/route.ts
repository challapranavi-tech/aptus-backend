import { getSiteConfig } from "@/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load site config", detail: String(err) },
      { status: 500 },
    );
  }
}

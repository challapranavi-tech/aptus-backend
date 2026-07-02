import { getHomePage } from "@/data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const page = await getHomePage();
    if (!page) {
      return NextResponse.json({ error: "Home page not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load home page", detail: String(err) },
      { status: 500 },
    );
  }
}

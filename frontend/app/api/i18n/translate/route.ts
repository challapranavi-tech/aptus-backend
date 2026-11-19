import { translateToArabic } from "@/lib/translate-text";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const MAX_STRINGS = 40;
const MAX_EACH = 4000;

/** Arabic copy for the page the visitor is looking at. */
export async function POST(req: NextRequest) {
  let body: { texts?: unknown };
  try {
    body = (await req.json()) as { texts?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const texts = Array.isArray(body.texts)
    ? body.texts.filter((item): item is string => typeof item === "string").slice(0, MAX_STRINGS)
    : [];
  if (!texts.length) return NextResponse.json({ texts: [] });

  const clipped = texts.map((text) => (text.length > MAX_EACH ? text.slice(0, MAX_EACH) : text));
  const translated = await translateToArabic(clipped);
  return NextResponse.json({ texts: translated });
}

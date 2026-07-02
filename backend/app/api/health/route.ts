import { NextResponse } from "next/server";

/** Health check for deploy probes. */
export async function GET() {
  return NextResponse.json({ status: "ok", service: "aptus-backend" });
}

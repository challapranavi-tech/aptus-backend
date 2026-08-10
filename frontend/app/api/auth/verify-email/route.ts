import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/server/auth-service";
import { jsonError, jsonOk } from "@/lib/server/http";

/**
 * GET is read-only: redirect to the confirm page so email scanners / SafeLinks
 * cannot burn the single-use token by prefetching.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const target = new URL("/verify-email", request.url);
  if (token) target.searchParams.set("token", token);
  return NextResponse.redirect(target);
}

/** Event 11 — Email Verification. Consume only on explicit POST from the confirm page. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const token = (body as { token?: string } | null)?.token?.trim();
  if (!token) {
    return jsonError("Missing verification token", 400, "MISSING_TOKEN");
  }

  const result = await consumeEmailVerificationToken(token);
  if (!result) {
    return jsonError(
      "This verification link is invalid, expired, or has already been used.",
      400,
      "INVALID_TOKEN",
    );
  }

  return jsonOk({ ok: true, email: result.email });
}

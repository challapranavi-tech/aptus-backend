import { validationErrorPayload, type FieldErrors } from "@shared/lib/schema";
import { NextResponse } from "next/server";

export function validationError(errors: FieldErrors): NextResponse {
  return NextResponse.json(validationErrorPayload(errors), { status: 400 });
}

export function requireJsonContentType(request: Request): FieldErrors | null {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return {
      "content-type": "Content-Type must be application/json.",
    };
  }
  return null;
}

import { validationErrorPayload, type FieldErrors } from "@shared/lib/schema";
import { NextResponse } from "next/server";

/** Consistent 400 validation response (no internals). */
export function validationError(
  errors: FieldErrors,
  wrap?: (response: NextResponse) => NextResponse,
): NextResponse {
  const response = NextResponse.json(validationErrorPayload(errors), {
    status: 400,
  });
  return wrap ? wrap(response) : response;
}

/** Require JSON Content-Type for mutating JSON endpoints. */
export function requireJsonContentType(request: Request): FieldErrors | null {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return {
      "content-type": "Content-Type must be application/json.",
    };
  }
  return null;
}

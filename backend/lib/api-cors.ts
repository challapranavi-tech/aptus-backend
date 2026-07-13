import { NextResponse } from "next/server";

function allowedOrigins(): string[] {
  const fromEnv = [
    process.env.APTUS_FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];
  // security: localhost is a local-dev convenience only — never auto-allow in prod.
  const origins =
    process.env.NODE_ENV === "production"
      ? fromEnv
      : [...fromEnv, "http://localhost:3000"];
  return [...new Set(origins)];
}

function pickOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return allowedOrigins().includes(origin) ? origin : null;
}

export function corsPreflight(request: Request): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  const origin = pickOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new NextResponse(null, { status: 204, headers });
}

export function withCors(response: NextResponse, request: Request): NextResponse {
  const origin = pickOrigin(request);
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function jsonCors(
  request: Request,
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  return withCors(NextResponse.json(body, init), request);
}

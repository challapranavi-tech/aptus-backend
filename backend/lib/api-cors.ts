import { NextResponse } from "next/server";

/** www ↔ apex are the same site for CORS — editors often set only one in env. */
function withWwwAliases(origin: string): string[] {
  try {
    const u = new URL(origin);
    const host = u.hostname;
    const alt = host.startsWith("www.")
      ? host.slice(4)
      : `www.${host}`;
    const port = u.port ? `:${u.port}` : "";
    return [
      `${u.protocol}//${host}${port}`,
      `${u.protocol}//${alt}${port}`,
    ];
  } catch {
    return [origin];
  }
}

export function allowedOrigins(): string[] {
  const fromEnv = [process.env.APTUS_FRONTEND_URL, process.env.NEXT_PUBLIC_SITE_URL]
    .filter(Boolean)
    .flatMap((v) => (v as string).split(","))
    .map((v) => v.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .flatMap(withWwwAliases);

  const origins =
    process.env.NODE_ENV === "production"
      ? fromEnv
      : [
          ...fromEnv,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ];

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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

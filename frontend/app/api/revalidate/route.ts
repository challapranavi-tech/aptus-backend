/**
 * POST /api/revalidate
 *
 * Called by the backend's /api/revalidate after it clears its own Odoo data
 * cache.  Clears the frontend's ISR page cache so the next visitor sees the
 * updated content immediately rather than waiting for the TTL to expire.
 *
 * Uses the same token and body shape as the backend endpoint so the Odoo
 * aptus_nextjs_sync module can also call this directly if APTUS_FRONTEND_URL
 * is pointed here instead.
 *
 * Body (JSON):
 *   { "slug": "about-us", "token": "..." }
 *   { "slugs": ["home", "about-us"], "token": "..." }
 *   { "all": true, "token": "..." }
 */

import { requireJsonContentType, validationError } from "@/lib/api-validate";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import {
  normaliseSlug,
  parseRevalidateRequest,
} from "@shared/lib/revalidate-request";
import { secureCompare } from "@shared/lib/secure-compare";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function checkToken(token: string | undefined): NextResponse | null {
  // security: shared webhook secret — never log the token or expected value.
  // Not a browser session: reject every bad token; rotate env to revoke access.
  const expectedToken = process.env.ODOO_REVALIDATE_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      {
        error: "Server misconfigured",
        hint: "Set ODOO_REVALIDATE_TOKEN on the frontend (must match backend + Odoo nextjs.token).",
      },
      { status: 503 },
    );
  }
  if (!token || !secureCompare(token, expectedToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  // IP limit is in middleware; token identity limits a compromised/shared secret.
  const ctError = requireJsonContentType(req);
  if (ctError) return validationError(ctError);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return validationError({ _form: "Invalid JSON body." });
  }

  const parsed = parseRevalidateRequest(raw);
  if (!parsed.ok) return validationError(parsed.errors);

  const body = parsed.data;
  const authError = checkToken(body.token);
  if (authError) return authError;

  const tokenLimited = enforceKeyRateLimit(
    identityKey(body.token),
    "authWriteUser",
    "revalidate",
  );
  if (tokenLimited) return tokenLimited;

  try {
    let revalidated: string[];

    if (body.all) {
      revalidatePath("/", "layout");
      revalidated = ["(all)"];
    } else {
      const rawSlugs: string[] = [
        ...(body.slugs ?? []),
        ...(body.slug ? [body.slug] : []),
      ];

      const normalised: string[] = [];
      for (const s of rawSlugs) {
        const slug = normaliseSlug(s);
        if (!slug) {
          return validationError({ slug: "Invalid page slug." });
        }
        normalised.push(slug);
      }

      revalidated = normalised.map((slug) => {
        revalidatePath(slug === "home" ? "/" : `/${slug}`);
        return slug;
      });
    }

    return NextResponse.json({ revalidated: true, slugs: revalidated });
  } catch (err) {
    console.error("[revalidate] failed:", err);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}

// GET for local manual testing only.
// security: query-string tokens are disabled in production (logs / Referer).
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sp = req.nextUrl.searchParams;
  const body: Record<string, unknown> = { token: sp.get("token") ?? "" };

  if (sp.get("all") === "true") {
    body.all = true;
  } else if (sp.get("slugs")) {
    body.slugs = sp.get("slugs")!.split(",");
  } else {
    body.slug = sp.get("slug") ?? "home";
  }

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

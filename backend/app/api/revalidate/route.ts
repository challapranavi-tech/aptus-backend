/**
 * POST /api/revalidate
 *
 * Called by the Odoo aptus_nextjs_sync module (or a Server Action) after any
 * website.page is saved.  Busts the ISR cache so Next.js re-fetches from Odoo,
 * then fans out to the frontend so its page cache is cleared too.
 *
 * Body (JSON) — single page:
 *   { "slug": "home" | "about-us" | ..., "token": "<ODOO_REVALIDATE_TOKEN>" }
 *
 * Body (JSON) — multiple pages at once:
 *   { "slugs": ["home", "about-us"], "token": "..." }
 *
 * Body (JSON) — nuke everything:
 *   { "all": true, "token": "..." }
 *
 * Success:  200 { revalidated: true, slugs: string[] }
 * Failure:  401 | 400 | 500 | 503
 *
 * GET (development only) — manual testing via query params; disabled in production
 * because tokens in query strings land in logs and referrer headers.
 */

import { requireJsonContentType, validationError } from "@/lib/api-validate";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import { invalidateOdooClientSession } from "@/data";
import { ODOO_CACHE_TAG } from "@/lib/odoo/client";
import {
  normaliseSlug,
  parseRevalidateRequest,
  type RevalidateRequest,
} from "@shared/lib/revalidate-request";
import { secureCompare } from "@shared/lib/secure-compare";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function checkToken(token: string | undefined): NextResponse | null {
  // security: shared webhook secret — never log the token or expected value.
  // Not a browser session: missing/wrong token is rejected every request;
  // there is nothing to "log out" — rotate ODOO_REVALIDATE_TOKEN to revoke.
  const expectedToken = process.env.ODOO_REVALIDATE_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      {
        error: "Server misconfigured",
        hint: "Set ODOO_REVALIDATE_TOKEN on this backend (must match frontend + Odoo nextjs.token).",
      },
      { status: 503 },
    );
  }
  if (!token || !secureCompare(token, expectedToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Fan-out to the frontend's revalidate endpoint so its ISR page cache is also
 * cleared.  Fire-and-forget with a 5 s cap — a timeout is non-fatal because
 * the frontend's ODOO_REVALIDATE TTL covers it.
 *
 * security: forwards ODOO_REVALIDATE_TOKEN only to APTUS_FRONTEND_URL (server
 * env). That URL must be HTTPS in production and never a user-controlled host.
 */
async function notifyFrontend(body: RevalidateRequest): Promise<void> {
  const frontendUrl = process.env.APTUS_FRONTEND_URL?.replace(/\/$/, "");
  if (!frontendUrl) return;

  try {
    await Promise.race([
      fetch(`${frontendUrl}/api/revalidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // ponytail: no next: { revalidate } here — this must always hit the wire
        cache: "no-store",
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 5_000)),
    ]);
  } catch {
    // non-fatal — do not log body (contains shared secret)
  }
}

export async function POST(req: NextRequest) {
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

  // IP limit is in middleware; token identity limits a compromised/shared secret.
  // security: ODOO_REVALIDATE_TOKEN is a site-wide admin capability (not per-slug
  // ACLs). Any valid token may bust any slug — there are no per-user page owners.
  const tokenLimited = enforceKeyRateLimit(
    identityKey(body.token),
    "authWriteUser",
    "revalidate",
  );
  if (tokenLimited) return tokenLimited;

  try {
    let revalidated: string[];

    // Bust OdooClient unstable_cache + in-memory field/session probes
    // (e.g. after creating x_* CMS fields on a fresh staging DB).
    invalidateOdooClientSession();
    revalidateTag(ODOO_CACHE_TAG);

    if (body.all) {
      revalidatePath("/", "layout");
      revalidatePath("/api/cms/slugs");
      revalidatePath("/api/cms/case-studies");
      revalidatePath("/api/cms/site-config");
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
        revalidateTag(`odoo-page-${slug}`);
        revalidatePath(slug === "home" ? "/api/cms/home" : `/api/cms/pages/${slug}`);
        if (slug === "aptus-case-studies") {
          revalidateTag("odoo-case-studies");
          revalidatePath("/api/cms/case-studies");
        }
        return slug;
      });

      revalidateTag("odoo-slugs");
      revalidatePath("/api/cms/slugs");
    }

    await notifyFrontend(body);

    return NextResponse.json({ revalidated: true, slugs: revalidated });
  } catch (err) {
    console.error("[revalidate] failed:", err);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}

// GET for local manual testing only — POST from Odoo in all deployed environments.
// security: tokens in query strings land in access logs and Referer headers —
// disabled in production.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sp = req.nextUrl.searchParams;
  const body: Record<string, unknown> = {
    token: sp.get("token") ?? "",
  };

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

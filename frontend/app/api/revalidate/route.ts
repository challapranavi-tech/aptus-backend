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

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

type Body = {
  slug?: string;
  slugs?: string[];
  all?: boolean;
  token?: string;
};

function normalise(slug: string): string {
  const raw = slug.trim();
  if (!raw) return "home";

  const pathLike = /^https?:\/\//i.test(raw)
    ? (() => {
        try {
          return new URL(raw).pathname;
        } catch {
          return raw;
        }
      })()
    : raw;

  const clean = pathLike
    .split(/[?#]/, 1)[0]
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

  return clean || "home";
}

function checkToken(token: string | undefined): NextResponse | null {
  const expectedToken = process.env.ODOO_REVALIDATE_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const authError = checkToken(body.token);
  if (authError) return authError;

  try {
    let revalidated: string[];

    if (body.all) {
      revalidatePath("/", "layout");
      revalidated = ["(all)"];
    } else {
      const raw: string[] = [
        ...(body.slugs ?? []),
        ...(body.slug ? [body.slug] : []),
      ];

      if (raw.length === 0) {
        return NextResponse.json(
          { error: "Provide slug, slugs, or all:true" },
          { status: 400 },
        );
      }

      revalidated = raw.map((s) => {
        const slug = normalise(s);
        // Frontend page paths — correct here since this IS the frontend server
        revalidatePath(slug === "home" ? "/" : `/${slug}`);
        return slug;
      });
    }

    return NextResponse.json({ revalidated: true, slugs: revalidated });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", detail: String(err) },
      { status: 500 },
    );
  }
}

// GET for local manual testing only
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sp = req.nextUrl.searchParams;
  const body: Body = { token: sp.get("token") ?? "" };

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

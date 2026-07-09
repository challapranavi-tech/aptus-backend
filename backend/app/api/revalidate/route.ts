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

  // Accept full URLs from webhook payloads.
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

/**
 * Fan-out to the frontend's revalidate endpoint so its ISR page cache is also
 * cleared.  Fire-and-forget with a 5 s cap — a timeout is non-fatal because
 * the frontend's ODOO_REVALIDATE TTL covers it.
 */
async function notifyFrontend(body: Body): Promise<void> {
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
    // non-fatal
  }
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
      // Clears every cached Odoo fetch in this backend instance
      revalidatePath("/", "layout");
      // Also clear the auxiliary API routes that aren't path-scoped
      revalidatePath("/api/cms/slugs");
      revalidatePath("/api/cms/case-studies");
      revalidatePath("/api/cms/site-config");
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
        // Clear the backend's own API route data cache
        revalidatePath(slug === "home" ? "/api/cms/home" : `/api/cms/pages/${slug}`);
        // Case studies page has a separate content endpoint
        if (slug === "aptus-case-studies") {
          revalidatePath("/api/cms/case-studies");
        }
        return slug;
      });

      // Any page publish/unpublish affects the slug list
      revalidatePath("/api/cms/slugs");
    }

    // Fan out to frontend — awaited but capped so Odoo save isn't blocked long
    await notifyFrontend(body);

    return NextResponse.json({ revalidated: true, slugs: revalidated });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", detail: String(err) },
      { status: 500 },
    );
  }
}

// GET for local manual testing only — POST from Odoo in all deployed environments.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sp = req.nextUrl.searchParams;
  const body: Body = {
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

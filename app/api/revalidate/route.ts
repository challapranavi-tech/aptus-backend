/**
 * POST /api/revalidate
 *
 * Called by the Odoo aptus_nextjs_sync module (or a Server Action) after any
 * website.page is saved.  Busts the ISR cache so Next.js re-fetches from Odoo.
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
 * Failure:  401 | 400 | 500
 *
 * GET shorthand for manual testing:
 *   /api/revalidate?slug=home&token=...
 *   /api/revalidate?all=true&token=...
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
  const s = slug.trim().replace(/^\//, "");
  return s || "home";
}

export async function POST(req: NextRequest) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const expectedToken = process.env.ODOO_REVALIDATE_TOKEN;
  if (expectedToken && body.token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let revalidated: string[];

    if (body.all) {
      // Revalidate the entire site tree (use sparingly — expensive)
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

// GET for easy manual testing in the browser
export async function GET(req: NextRequest) {
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

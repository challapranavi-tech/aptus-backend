/**
 * POST /api/cms/seed-page
 *
 * One-shot: write committed content/odoo-json (+ optional odoo-xml arch) onto the
 * live Odoo website.page that this backend is connected to.
 *
 * Body: { "slug": "telephone-systems", "token": "<ODOO_REVALIDATE_TOKEN>" }
 *
 * security: same shared secret as /api/revalidate — not a public write.
 */
import { requireJsonContentType, validationError } from "@/lib/api-validate";
import { enforceKeyRateLimit, identityKey } from "@/lib/rate-limit-http";
import { invalidateOdooClientSession } from "@/data";
import {
  authenticate,
  odooConfigFromEnv,
  searchRead,
  write,
  ODOO_CACHE_TAG,
  invalidatePageFieldCache,
} from "@/lib/odoo";
import { mapPageJson } from "@/lib/odoo/page-json-mapper";
import { secureCompare } from "@shared/lib/secure-compare";
import { revalidatePath, revalidateTag } from "next/cache";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["telephone-systems"]);

function checkToken(token: unknown): NextResponse | null {
  const expected = process.env.ODOO_REVALIDATE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured", hint: "Set ODOO_REVALIDATE_TOKEN" },
      { status: 503 },
    );
  }
  if (typeof token !== "string" || !secureCompare(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function jsonPathFor(slug: string): string {
  return path.join(process.cwd(), "content", "odoo-json", "elv", `${slug}.json`);
}

function xmlPathFor(slug: string): string {
  return path.join(process.cwd(), "content", "odoo-xml", `${slug}.xml`);
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

  const body = raw as { slug?: unknown; token?: unknown; writeArch?: unknown };
  const authError = checkToken(body.token);
  if (authError) return authError;

  const tokenLimited = await enforceKeyRateLimit(
    identityKey(String(body.token)),
    "authWriteUser",
    "seed-page",
  );
  if (tokenLimited) return tokenLimited;

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  if (!slug || !ALLOWED.has(slug)) {
    return validationError({ slug: `Allowed: ${[...ALLOWED].join(", ")}` });
  }

  const file = jsonPathFor(slug);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: `Missing JSON on disk: ${file}` }, { status: 500 });
  }

  const jsonString = fs.readFileSync(file, "utf8");
  try {
    JSON.parse(jsonString);
  } catch {
    return NextResponse.json({ error: "Disk JSON is invalid" }, { status: 500 });
  }
  if (!mapPageJson(jsonString, { slug })?.length) {
    return NextResponse.json({ error: "Disk JSON did not map to sections" }, { status: 500 });
  }

  const cfg = odooConfigFromEnv();
  if (!cfg.url || !cfg.db || !cfg.user || !cfg.apiKey) {
    return NextResponse.json({ error: "Odoo not configured on this deployment" }, { status: 503 });
  }

  try {
    const session = await authenticate(cfg.url, cfg.db, cfg.user, cfg.apiKey, cfg.revalidate);
    const url = `/${slug}`;
    const pages = await searchRead<{
      id: number;
      url: string;
      view_id: [number, string] | false;
      write_date?: string;
    }>(session, "website.page", [["url", "=", url]], {
      fields: ["id", "url", "view_id", "write_date"],
      limit: 3,
      order: "id desc",
    });

    if (!pages[0]) {
      return NextResponse.json({ error: `No website.page for ${url}` }, { status: 404 });
    }

    const pageId = pages[0].id;
    const viewId = Array.isArray(pages[0].view_id) ? pages[0].view_id[0] : null;

    let jsonWritten = false;
    let jsonError: string | undefined;
    try {
      await write(session, "website.page", pageId, {
        x_page_sections_json: jsonString,
        is_published: true,
        website_published: true,
      });
      jsonWritten = true;
    } catch (err) {
      jsonError = err instanceof Error ? err.message : String(err);
    }

    let archWritten = false;
    let archError: string | undefined;
    const wantArch = body.writeArch !== false;
    const xmlFile = xmlPathFor(slug);
    if (wantArch && viewId && fs.existsSync(xmlFile)) {
      try {
        const arch = fs.readFileSync(xmlFile, "utf8");
        await write(session, "ir.ui.view", viewId, { arch, arch_db: arch });
        archWritten = true;
      } catch (err) {
        archError = err instanceof Error ? err.message : String(err);
      }
    }

    invalidateOdooClientSession();
    invalidatePageFieldCache();
    revalidateTag(ODOO_CACHE_TAG);
    revalidateTag(`odoo-page-${slug}`);
    revalidatePath(`/api/cms/pages/${slug}`);

    if (!jsonWritten) {
      return NextResponse.json(
        {
          ok: false,
          slug,
          pageId,
          viewId,
          odooHost: cfg.url,
          jsonWritten,
          jsonError,
          archWritten,
          archError,
          hint:
            "x_page_sections_json write failed. Create that field on website.page in Odoo Studio, or fix API access.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      slug,
      pageId,
      viewId,
      odooHost: cfg.url,
      jsonWritten,
      archWritten,
      archError,
      bytes: jsonString.length,
    });
  } catch (err) {
    console.error("[seed-page] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}

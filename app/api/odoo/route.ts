/**
 * GET /api/odoo
 *
 * Development-only debug route for inspecting the live Odoo connection.
 * Returns raw Odoo records so you can verify mapping before going live.
 *
 * Only enabled when NODE_ENV !== "production".
 * Protected by a simple secret token (ODOO_DEBUG_TOKEN env var).
 *
 * Usage:
 *   curl http://localhost:3000/api/odoo
 *   curl http://localhost:3000/api/odoo?model=pages
 *   curl http://localhost:3000/api/odoo?model=menus
 *   curl http://localhost:3000/api/odoo?model=version
 *   curl "http://localhost:3000/api/odoo?model=view&id=42"
 */

import { OdooClient, OdooRpcError, isOdooConfigured, odooConfigFromEnv } from "@/lib/odoo";
import { getVersionInfo } from "@/lib/odoo/rpc";
import { NextRequest, NextResponse } from "next/server";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function guard(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return json({ error: "Debug route disabled in production." }, 403);
  }

  const token = process.env.ODOO_DEBUG_TOKEN;
  if (token) {
    const provided =
      req.headers.get("x-debug-token") ??
      req.nextUrl.searchParams.get("token");
    if (provided !== token) {
      return json({ error: "Invalid or missing debug token." }, 401);
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const model = req.nextUrl.searchParams.get("model") ?? "status";
  const viewId = req.nextUrl.searchParams.get("id");

  // ── Status / config check ─────────────────────────────────────────────────
  if (model === "status") {
    const cfg = odooConfigFromEnv();
    const configured = isOdooConfigured();

    if (!configured) {
      return json({
        status: "not_configured",
        message: "Set ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY in .env.local",
        env: {
          ODOO_URL: cfg.url ? "✓ set" : "✗ missing",
          ODOO_DB: cfg.db ? "✓ set" : "✗ missing",
          ODOO_USER: cfg.user ? "✓ set" : "✗ missing",
          ODOO_API_KEY: cfg.apiKey ? "✓ set" : "✗ missing",
        },
      });
    }

    try {
      const client = await OdooClient.create();
      void client; // auth successful
      const version = await getVersionInfo(cfg.url);
      return json({
        status: "connected",
        odoo_version: version.server_version,
        odoo_serie: version.server_serie,
        database: cfg.db,
        website_id: cfg.websiteId,
        revalidate_seconds: cfg.revalidate,
        endpoints: [
          "/api/odoo?model=version",
          "/api/odoo?model=pages",
          "/api/odoo?model=menus",
          "/api/odoo?model=view&id={view_id}",
        ],
      });
    } catch (err) {
      return json(
        {
          status: "error",
          message: err instanceof OdooRpcError ? err.message : String(err),
          http_status: err instanceof OdooRpcError ? err.httpStatus : undefined,
        },
        502,
      );
    }
  }

  // ── Version (no auth) ─────────────────────────────────────────────────────
  if (model === "version") {
    const { url } = odooConfigFromEnv();
    if (!url) return json({ error: "ODOO_URL not set" }, 400);
    try {
      const v = await getVersionInfo(url);
      return json(v);
    } catch (err) {
      return json({ error: String(err) }, 502);
    }
  }

  // ── All remaining models require auth ─────────────────────────────────────
  if (!isOdooConfigured()) {
    return json({ error: "Odoo not configured — check .env.local" }, 400);
  }

  try {
    const client = await OdooClient.create();

    if (model === "pages") {
      const pages = await client.rawPages();
      return json({ count: pages.length, records: pages });
    }

    if (model === "menus") {
      const menus = await client.rawMenus();
      return json({ count: menus.length, records: menus });
    }

    if (model === "view") {
      if (!viewId || isNaN(Number(viewId))) {
        return json({ error: "Pass ?model=view&id={view_id}" }, 400);
      }
      const view = await client.rawView(Number(viewId));
      return json(view ?? { error: "View not found" });
    }

    return json({ error: `Unknown model "${model}". Use: status | version | pages | menus | view` }, 400);
  } catch (err) {
    return json(
      {
        error: err instanceof OdooRpcError ? err.message : String(err),
        detail: err instanceof OdooRpcError ? err.odooData : undefined,
      },
      502,
    );
  }
}

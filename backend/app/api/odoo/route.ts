/**
 * GET /api/odoo
 *
 * Development-only debug route for inspecting the live Odoo connection.
 * Returns raw Odoo records so you can verify mapping before going live.
 *
 * security:
 *  - Disabled entirely when NODE_ENV === "production".
 *  - Fail-closed: ODOO_DEBUG_TOKEN must be set; requests without a valid
 *    X-Debug-Token header are rejected. Query-string tokens are not accepted
 *    (they leak via logs and Referer).
 *  - Never returns ODOO_API_KEY or other credentials.
 */

import { validationError } from "@/lib/api-validate";
import {
  enforceKeyRateLimit,
  identityKey,
} from "@/lib/rate-limit-http";
import { OdooClient, OdooRpcError, isOdooConfigured, odooConfigFromEnv } from "@/lib/odoo";
import { getVersionInfo } from "@/lib/odoo/rpc";
import {
  parseDebugTokenHeader,
  parseOdooDebugQuery,
} from "@shared/lib/odoo-debug-request";
import { secureCompare } from "@shared/lib/secure-compare";
import { NextRequest, NextResponse } from "next/server";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function guard(provided: string | undefined): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return json({ error: "Debug route disabled in production." }, 403);
  }

  // security: fail closed — empty ODOO_DEBUG_TOKEN must not open the route.
  // Not a browser session cookie: each request must present X-Debug-Token;
  // rotate or unset the env var to revoke (no logout endpoint).
  const expectedToken = process.env.ODOO_DEBUG_TOKEN;
  if (!expectedToken) {
    return json(
      { error: "Debug route misconfigured. Set ODOO_DEBUG_TOKEN." },
      503,
    );
  }

  if (!provided || !secureCompare(provided, expectedToken)) {
    return json({ error: "Invalid or missing debug token." }, 401);
  }

  return null;
}

export async function GET(req: NextRequest) {
  const headerToken = parseDebugTokenHeader(req.headers.get("x-debug-token"));
  if (!headerToken.ok) return validationError(headerToken.errors);

  // Reject legacy ?token= — secrets must not appear in URLs.
  if (req.nextUrl.searchParams.has("token")) {
    return validationError({
      token: "Pass the debug token via the X-Debug-Token header only.",
    });
  }

  const query = parseOdooDebugQuery(req.nextUrl.searchParams);
  if (!query.ok) return validationError(query.errors);

  const providedToken = headerToken.data.token;
  const blocked = guard(providedToken);
  if (blocked) return blocked;

  const tokenLimited = await enforceKeyRateLimit(
    identityKey(providedToken!),
    "debug",
    "odoo-debug",
  );
  if (tokenLimited) return tokenLimited;

  const { model, id: viewId } = query.data;

  if (model === "status") {
    const cfg = odooConfigFromEnv();
    const configured = isOdooConfigured();

    if (!configured) {
      // Presence flags only — never echo secret values.
      return json({
        status: "not_configured",
        message: "Set ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY in .env.local",
        env: {
          ODOO_URL: Boolean(cfg.url),
          ODOO_DB: Boolean(cfg.db),
          ODOO_USER: Boolean(cfg.user),
          ODOO_API_KEY: Boolean(cfg.apiKey),
        },
      });
    }

    try {
      const client = await OdooClient.create();
      void client;
      const version = await getVersionInfo(cfg.url);
      return json({
        status: "connected",
        odoo_version: version.server_version,
        odoo_serie: version.server_serie,
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
      console.error("[odoo] status check failed:", err);
      return json({ status: "error", message: "Upstream request failed." }, 502);
    }
  }

  if (model === "version") {
    const { url } = odooConfigFromEnv();
    if (!url) return json({ error: "ODOO_URL not set" }, 400);
    try {
      const v = await getVersionInfo(url);
      return json(v);
    } catch (err) {
      console.error("[odoo] version failed:", err);
      return json({ error: "Upstream request failed." }, 502);
    }
  }

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
      // security: rawView enforces website-scoped object auth on the view id.
      const view = await client.rawView(viewId!);
      return json(view ?? { error: "View not found" });
    }

    return validationError({
      model: "Unknown model. Use: status | version | pages | menus | view",
    });
  } catch (err) {
    console.error("[odoo] query failed:", err);
    if (err instanceof OdooRpcError) {
      return json({ error: "Upstream request failed." }, 502);
    }
    return json({ error: "Upstream request failed." }, 502);
  }
}

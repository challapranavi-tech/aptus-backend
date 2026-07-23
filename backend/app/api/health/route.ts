import {
  getVersionInfo,
  isOdooConfigured,
  normalizeOdooBaseUrl,
  odooConfigFromEnv,
} from "@/lib/odoo";
import { NextResponse } from "next/server";

/**
 * Health / readiness for deploy probes and live misconfig debugging.
 * Always HTTP 200 so platform probes stay green; check `ready` + `checks`.
 */
export async function GET() {
  const onVercel = process.env.VERCEL === "1";
  const odooConfigured = isOdooConfigured();
  const revalidateToken = Boolean(process.env.ODOO_REVALIDATE_TOKEN?.trim());
  const frontendUrl = Boolean(process.env.APTUS_FRONTEND_URL?.trim());
  const blobArchive = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  const rawOdooUrl = process.env.ODOO_URL ?? "";
  const normalizedUrl = normalizeOdooBaseUrl(rawOdooUrl);
  const odooUrlHadUiPath =
    Boolean(rawOdooUrl.trim()) &&
    normalizeOdooBaseUrl(rawOdooUrl) !== rawOdooUrl.trim().replace(/\/+$/, "");

  // Live RPC probe — catches bad hosts even when env vars are non-empty.
  let odooReachable: boolean | null = null;
  if (odooConfigured) {
    try {
      await getVersionInfo(odooConfigFromEnv().url);
      odooReachable = true;
    } catch {
      odooReachable = false;
    }
  }

  const checks = {
    odooConfigured,
    odooReachable,
    odooUrlHadUiPath,
    revalidateToken,
    frontendUrl,
    /** On Vercel, career apply needs Blob — disk is read-only. */
    blobArchive: onVercel ? blobArchive : true,
  };

  const ready =
    checks.odooConfigured &&
    checks.odooReachable !== false &&
    checks.revalidateToken;

  return NextResponse.json({
    status: ready ? "ok" : "misconfigured",
    ready,
    service: "aptus-backend",
    checks,
    // Host only — never echo credentials. Helps confirm which instance is wired.
    odooHost: normalizedUrl || null,
    hints: ready
      ? odooUrlHadUiPath
        ? [
            "ODOO_URL contained /odoo or /web — normalized automatically. Prefer the host-only URL in Vercel (no /odoo).",
          ]
        : undefined
      : [
          !checks.odooConfigured
            ? "Set ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY (staging or prod instance — not /odoo/website)."
            : null,
          checks.odooReachable === false
            ? "Odoo JSON-RPC unreachable. Use host-only ODOO_URL (https://….odoo.com) with no /odoo suffix, then redeploy."
            : null,
          !checks.revalidateToken
            ? "Set ODOO_REVALIDATE_TOKEN (must match frontend + Odoo nextjs.token)."
            : null,
          onVercel && !checks.frontendUrl
            ? "Set APTUS_FRONTEND_URL so /api/revalidate can fan-out to the site."
            : null,
          onVercel && !blobArchive
            ? "Link a private Vercel Blob store (BLOB_READ_WRITE_TOKEN) for career application archives."
            : null,
        ].filter(Boolean),
  });
}

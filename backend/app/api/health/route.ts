import { isOdooConfigured } from "@/lib/odoo";
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

  const checks = {
    odooConfigured,
    revalidateToken,
    frontendUrl,
    /** On Vercel, career apply needs Blob — disk is read-only. */
    blobArchive: onVercel ? blobArchive : true,
  };

  const ready = checks.odooConfigured && checks.revalidateToken;

  return NextResponse.json({
    status: ready ? "ok" : "misconfigured",
    ready,
    service: "aptus-backend",
    checks,
    hints: ready
      ? undefined
      : [
          !checks.odooConfigured
            ? "Set ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY (staging or prod instance — not /odoo/website)."
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

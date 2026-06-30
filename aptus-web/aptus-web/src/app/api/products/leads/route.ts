import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimitedResponse } from "@/lib/server/http";
import { isDemoMode, isOdooConfigured } from "@/lib/server/config";
import { createAutodeskProductLead } from "@/lib/server/odoo/leads";
import { checkRateLimit, rateLimitKey } from "@/lib/server/rate-limit";
import type { AutodeskProductLeadType } from "@/types/autodesk-product";

const LEAD_RATE = { max: 8, windowMs: 15 * 60 * 1000 };
const VALID_TYPES = new Set<AutodeskProductLeadType>(["contact", "demo", "quote", "download"]);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limit = await checkRateLimit(
    rateLimitKey("products:lead", ip),
    LEAD_RATE.max,
    LEAD_RATE.windowMs,
  );
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSec);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const data = body as Record<string, unknown>;
  const leadType = String(data.leadType ?? "contact") as AutodeskProductLeadType;
  const productSlug = String(data.productSlug ?? "").trim();
  const productName = String(data.productName ?? "").trim();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const phone = String(data.phone ?? "").trim() || undefined;
  const company = String(data.company ?? "").trim() || undefined;
  const message = String(data.message ?? "").trim() || undefined;

  if (!VALID_TYPES.has(leadType)) {
    return jsonError("Invalid lead type", 400);
  }
  if (!productSlug || !productName) {
    return jsonError("Product information is required", 400);
  }
  if (!name || !email) {
    return jsonError("Name and email are required", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Invalid email address", 400);
  }

  if (!isOdooConfigured()) {
    return jsonError("Lead submission is temporarily unavailable", 503);
  }

  if (isDemoMode()) {
    return jsonOk({ success: true, demo: true, leadId: null });
  }

  try {
    const leadId = await createAutodeskProductLead({
      leadType,
      productSlug,
      productName,
      name,
      email,
      phone,
      company,
      message,
    });
    return jsonOk({ success: true, leadId });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to submit lead",
      500,
    );
  }
}

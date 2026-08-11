import { getOdooClient } from "./client";
import { logger } from "../logger";
import type { LicenseStatus, SubscriptionItem, SubscriptionStatus } from "@/types/subscriptions";
import { getRelatedPartnerIds } from "./partner-context";

type OdooSaleOrderRow = {
  id: number;
  name: string;
  state: string;
  date_order: string | false;
  start_date: string | false;
  end_date: string | false;
  next_invoice_date: string | false;
  subscription_state: string | false;
  order_line: number[];
};

type OdooSaleOrderLineRow = {
  id: number;
  order_id: [number, string] | number;
  product_id: [number, string] | false;
  name: string | false;
  [key: string]: unknown;
};

/** Odoo staging uses prefixed states like 3_progress; default Odoo uses progress. */
function getActiveSubscriptionStates(): string[] {
  const raw = process.env.ODOO_SUBSCRIPTION_ACTIVE_STATES?.trim();
  if (raw) {
    return raw.split(",").map((value) => value.trim()).filter(Boolean);
  }
  return ["progress", "3_progress"];
}

function getConfirmedSaleOrderStates(): string[] {
  const raw = process.env.ODOO_SALE_ORDER_ACTIVE_STATES?.trim();
  if (raw) {
    return raw.split(",").map((value) => value.trim()).filter(Boolean);
  }
  return ["sale", "done"];
}

function isInactiveSubscriptionState(state: string | false | null | undefined): boolean {
  if (!state || typeof state !== "string") return true;
  const inactive = ["6_churn", "4_paused", "1_draft", "churn", "paused", "draft"];
  return inactive.some((token) => state === token || state.endsWith(`_${token}`) || state.includes("churn"));
}

function isActiveSubscriptionState(state: string | false | null | undefined): boolean {
  if (isInactiveSubscriptionState(state)) return false;
  if (!state || typeof state !== "string") return false;
  if (getActiveSubscriptionStates().includes(state)) return true;
  return state.endsWith("_progress") || state === "progress";
}

/** License key field on sale.order.line (Studio custom field on this Odoo instance). */
function getLicenseFieldNames(): string[] {
  const fromEnv = process.env.ODOO_LICENSE_FIELD?.trim();
  const defaults = ["x_studio_line_serial_number", "serial_number", "lot_id"];
  if (fromEnv) return [fromEnv, ...defaults.filter((field) => field !== fromEnv)];
  return defaults;
}

/** Optional download/installer URL on sale.order.line. */
function getDownloadUrlFieldNames(): string[] {
  const fromEnv = process.env.ODOO_DOWNLOAD_URL_FIELD?.trim();
  const defaults = ["x_studio_download_url", "x_studio_installer_url"];
  if (fromEnv) return [fromEnv, ...defaults.filter((field) => field !== fromEnv)];
  return defaults;
}

async function readOrderLinesWithExtras(
  lineIds: number[],
): Promise<{ lines: OdooSaleOrderLineRow[]; licenseField: string | null; downloadField: string | null }> {
  const client = getOdooClient();
  if (!client) return { lines: [], licenseField: null, downloadField: null };

  const licenseFields = getLicenseFieldNames();
  const downloadFields = getDownloadUrlFieldNames();

  let licenseField: string | null = null;
  let downloadField: string | null = null;
  let lines: OdooSaleOrderLineRow[] | null = null;

  for (const candidate of licenseFields) {
    try {
      lines = await client.read<OdooSaleOrderLineRow>(
        "sale.order.line",
        lineIds,
        ["product_id", "name", "order_id", candidate],
      );
      licenseField = candidate;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Invalid field") && message.includes(candidate)) {
        continue;
      }
      throw error;
    }
  }

  if (!lines) {
    lines = await client.read<OdooSaleOrderLineRow>(
      "sale.order.line",
      lineIds,
      ["product_id", "name", "order_id"],
    );
  }

  for (const candidate of downloadFields) {
    try {
      const withDownload = await client.read<OdooSaleOrderLineRow>(
        "sale.order.line",
        lineIds,
        ["id", candidate],
      );
      downloadField = candidate;
      const byId = new Map(withDownload.map((row) => [row.id, row]));
      for (const line of lines) {
        const extra = byId.get(line.id);
        if (extra && candidate in extra) {
          line[candidate] = extra[candidate];
        }
      }
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Invalid field") && message.includes(candidate)) {
        continue;
      }
      throw error;
    }
  }

  return { lines, licenseField, downloadField };
}

function extractLicenseKey(line: OdooSaleOrderLineRow, licenseField: string | null): string {
  if (!licenseField) return "";

  const raw = line[licenseField];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[1] === "string") return raw[1].trim();
  return "";
}

/** True when any order line already has a serial/license key (issued). */
export async function saleOrderHasIssuedLicense(lineIds: number[]): Promise<boolean> {
  if (!lineIds.length) return false;
  try {
    const { lines, licenseField } = await readOrderLinesWithExtras(lineIds);
    if (!licenseField) return false;
    return lines.some((line) => Boolean(extractLicenseKey(line, licenseField)));
  } catch {
    return false;
  }
}

function extractDownloadUrl(line: OdooSaleOrderLineRow, downloadField: string | null): string {
  if (!downloadField) return "";
  const raw = line[downloadField];
  if (typeof raw === "string") return raw.trim();
  return "";
}

function odooDateToIso(value: string | false | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  return value.split(" ")[0] ?? "";
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "—";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapSubscriptionStatus(
  state: string | false | null | undefined,
  endDateIso: string,
  hasLicense: boolean,
): SubscriptionStatus {
  if (isCancelledSubscriptionState(state)) return "Cancelled";
  if (isActiveSubscriptionState(state)) {
    if (isExpiringSoon(endDateIso)) return "Expiring Soon";
    return "Active";
  }
  // Confirmed sale with a license but no subscription lifecycle → treat as issued/active.
  if (hasLicense && (!state || isInactiveSubscriptionState(state))) {
    if (endDateIso) {
      const end = new Date(`${endDateIso}T23:59:59`);
      if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return "Expired";
      if (isExpiringSoon(endDateIso)) return "Expiring Soon";
    }
    return "Active";
  }
  return "Expired";
}

function licenseStatusFor(key: string): LicenseStatus {
  return key.trim() ? "Issued" : "Pending";
}

function isCancelledSubscriptionState(state: string | false | null | undefined): boolean {
  if (!state || typeof state !== "string") return false;
  const cancelled = ["6_churn", "churn", "cancel"];
  return cancelled.some((token) => state === token || state.endsWith(`_${token}`) || state.includes("churn"));
}

const EXPIRING_SOON_DAYS = Number(process.env.SUBSCRIPTION_EXPIRING_DAYS ?? 30);

function isExpiringSoon(endDateIso: string): boolean {
  if (!endDateIso) return false;
  const end = new Date(`${endDateIso}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  const now = new Date();
  if (end.getTime() < now.getTime()) return false;
  const msUntil = end.getTime() - now.getTime();
  return msUntil <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
}

function m2oLabel(value: [number, string] | false | null | undefined): string {
  return Array.isArray(value) ? value[1] : "";
}

/** Human-readable product title — not the internal Odoo SKU code. */
function formatProductName(line: OdooSaleOrderLineRow): string {
  const lineName = typeof line.name === "string" ? line.name.trim() : "";
  const fromProduct = m2oLabel(line.product_id).replace(/^\[[^\]]+\]\s*/, "").trim();
  const source = fromProduct || lineName;

  if (!source) return "Unknown product";

  // e.g. "AutoCAD - including specialized toolsets AD Commercial …" → "AutoCAD"
  const primary = source.split(" - ")[0]?.split(" AD ")[0]?.trim() || source;
  if (primary.length <= 80) return primary;
  return `${primary.slice(0, 77)}…`;
}

/** Subscription renewal — end_date is authoritative; next_invoice_date is often the start date. */
function resolveRenewalDateIso(order: OdooSaleOrderRow): string {
  const purchase = odooDateToIso(order.date_order);
  const start = odooDateToIso(order.start_date);
  const end = odooDateToIso(order.end_date);
  const nextInvoice = odooDateToIso(order.next_invoice_date);

  if (end && end !== purchase && end !== start) return end;
  if (nextInvoice && nextInvoice !== purchase && nextInvoice !== start) return nextInvoice;
  return end || nextInvoice;
}

function orderIdFromLine(line: OdooSaleOrderLineRow): number | null {
  if (Array.isArray(line.order_id)) return line.order_id[0];
  return typeof line.order_id === "number" ? line.order_id : null;
}

/** Active and historical subscriptions for a portal customer from Odoo sale.order + sale.order.line. */
export async function fetchPartnerSubscriptions(
  partnerId: number,
  options?: { includeInactive?: boolean },
): Promise<SubscriptionItem[]> {
  const includeInactive = options?.includeInactive ?? false;
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const activeStates = getActiveSubscriptionStates();

  logger.info("Fetching partner subscriptions from Odoo", {
    action: "subscriptions.fetch",
    partnerId,
    relatedPartnerCount: partnerIds.length,
    activeStates,
    licenseFields: getLicenseFieldNames(),
    downloadFields: getDownloadUrlFieldNames(),
  });

  const orders = await client.searchRead<OdooSaleOrderRow>(
    "sale.order",
    [
      ["partner_id", "in", partnerIds],
      ["state", "in", getConfirmedSaleOrderStates()],
    ],
    ["name", "state", "date_order", "start_date", "end_date", "next_invoice_date", "subscription_state", "order_line"],
    100,
  );

  if (!orders.length) return [];

  const lineIds = [...new Set(orders.flatMap((order) => order.order_line ?? []))];
  if (!lineIds.length) return [];

  const { lines, licenseField, downloadField } = await readOrderLinesWithExtras(lineIds);
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const results: SubscriptionItem[] = [];

  for (const line of lines) {
    const orderId = orderIdFromLine(line);
    if (orderId == null) continue;

    const order = orderById.get(orderId);
    if (!order) continue;

    const licenseKey = extractLicenseKey(line, licenseField);
    const hasLicense = Boolean(licenseKey);

    // License keys only — nothing shows in Licenses until Software Team issues them.
    if (!hasLicense) continue;

    const renewalIso = resolveRenewalDateIso(order);
    const endIso = odooDateToIso(order.end_date);
    const expiryDisplay = formatDisplayDate(endIso || renewalIso);
    const downloadUrl = extractDownloadUrl(line, downloadField);

    results.push({
      orderId,
      lineId: line.id,
      productName: formatProductName(line),
      purchaseDate: formatDisplayDate(odooDateToIso(order.start_date || order.date_order)),
      renewalDate: expiryDisplay,
      expiryDate: expiryDisplay,
      renewalDateIso: endIso || renewalIso,
      status: mapSubscriptionStatus(order.subscription_state, endIso || renewalIso, hasLicense),
      licenseStatus: licenseStatusFor(licenseKey),
      licenseKey,
      downloadUrl: downloadUrl || undefined,
    });
  }

  logger.info("Subscriptions mapped for portal", {
    action: "subscriptions.fetch",
    partnerId,
    count: results.length,
    licenseField,
    downloadField,
    includeInactive,
  });

  return results.sort((a, b) => a.productName.localeCompare(b.productName));
}

/** Close an active Odoo subscription (sale.order) for a portal customer. */
export async function closePartnerSubscription(
  partnerId: number,
  orderId: number,
): Promise<boolean> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const rows = await client.read<{
    partner_id: [number, string] | false;
    subscription_state: string | false;
    state: string;
  }>("sale.order", [orderId], ["partner_id", "subscription_state", "state"]);

  const order = rows[0];
  if (!order) {
    throw new Error(`Sale order ${orderId} not found`);
  }

  const orderPartnerId = Array.isArray(order.partner_id) ? order.partner_id[0] : null;
  if (orderPartnerId == null || !partnerIds.includes(orderPartnerId)) {
    throw new Error("Sale order does not belong to this account");
  }

  if (isCancelledSubscriptionState(order.subscription_state)) {
    logger.info("Subscription already closed", {
      action: "subscription.close",
      partnerId,
      orderId,
      subscriptionState: order.subscription_state,
    });
    return false;
  }

  if (!isActiveSubscriptionState(order.subscription_state)) {
    logger.info("Subscription not active — skipping close", {
      action: "subscription.close",
      partnerId,
      orderId,
      subscriptionState: order.subscription_state,
    });
    return false;
  }

  try {
    await client.call("sale.order", "set_close", [[orderId]]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("sale.order.set_close failed (continuing with churn write)", {
      action: "subscription.close",
      orderId,
      error: message,
    });
  }

  await client.write("sale.order", [orderId], { subscription_state: "6_churn" });

  logger.info("Subscription closed in Odoo", {
    action: "subscription.close",
    partnerId,
    orderId,
  });

  return true;
}

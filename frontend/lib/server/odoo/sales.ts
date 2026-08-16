import { getOdooClient } from "./client";
import { createOdooAttachment } from "./attachments";
import { getPartnerOdooContext, resolveCrmRouting } from "./partner-context";
import { formatPaymentPendingNote } from "./payment-meta";
import { getCrmLeadNotesFieldName } from "./crm-lead-notes";
import { lineConfigSummary } from "@/lib/portal-cart-checkout";

export function isRecoverableSaleOrderCreateError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Sequence code|sale\.order\.software/i.test(message);
}

function m2oId(value: [number, string] | false | null | undefined): number | undefined {
  return Array.isArray(value) ? value[0] : undefined;
}

/** Find a sellable product variant by name, scoped to the partner's company when possible. */
export async function findProductIdByName(
  name: string,
  companyId?: number,
): Promise<number | null> {
  const client = getOdooClient();
  if (!client) return null;

  const trimmed = name.trim();
  if (!trimmed) return null;

  const domain: unknown[] = [["name", "ilike", trimmed]];
  if (companyId) {
    domain.push("|", ["company_id", "=", false], ["company_id", "=", companyId]);
  }

  const rows = await client.searchRead<{
    id: number;
    name: string;
    company_id: [number, string] | false;
  }>("product.product", domain, ["id", "name", "company_id"], 10);

  const exact = rows.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  const candidate = exact ?? rows[0];
  if (!candidate) return null;

  const productCompanyId = m2oId(candidate.company_id);
  if (companyId && productCompanyId && productCompanyId !== companyId) {
    return null;
  }

  return candidate.id;
}

export type PortalOrderLine = {
  productName: string;
  quantity: number;
  category?: string;
  duration?: "1year" | "3year";
  purchaseType?: "new" | "renew";
  packageId?: string;
  levelId?: string;
  serialNumber?: string;
};

/** Draft sales order with multiple product lines from the portal checkout. */
export async function createPortalSaleOrderWithLines(input: {
  partnerId: number;
  duration: "1year" | "3year";
  lines: PortalOrderLine[];
  notes?: string;
  /** Customer-facing order reference stored on the quotation (client_order_ref). */
  orderReference?: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const ctx = await getPartnerOdooContext(input.partnerId);
  const softwareCompanyId = resolveCrmRouting("software").companyId ?? ctx.companyId;

  const orderLines: unknown[] = [];
  for (const line of input.lines) {
    const productId = await findProductIdByName(line.productName, softwareCompanyId);
    const label = line.category ? `${line.category} — ${line.productName}` : line.productName;
    const summary = lineConfigSummary(
      {
        category: line.category ?? "",
        productName: line.productName,
        quantity: line.quantity,
        duration: line.duration,
        purchaseType: line.purchaseType,
        packageId: line.packageId,
        levelId: line.levelId,
        serialNumber: line.serialNumber,
      },
      input.duration,
    );
    orderLines.push([
      0,
      0,
      productId
        ? {
            product_id: productId,
            product_uom_qty: line.quantity,
            name: `${label} (${summary})`,
          }
        : {
            name: `${label} (${summary})`,
            product_uom_qty: line.quantity,
          },
    ]);
  }

  const orderValues: Record<string, unknown> = {
    partner_id: input.partnerId,
    origin: "Aptus Customer Portal",
    note: input.notes ?? "",
    order_line: orderLines,
  };
  if (input.orderReference) orderValues.client_order_ref = input.orderReference;
  if (softwareCompanyId) orderValues.company_id = softwareCompanyId;

  return client.create("sale.order", orderValues);
}

/** Draft sales order linked to the portal customer (visible under Sales on the contact). */
export async function createPortalSaleOrder(input: {
  partnerId: number;
  productName: string;
  notes?: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const ctx = await getPartnerOdooContext(input.partnerId);
  const elvCompanyId = resolveCrmRouting("elv").companyId ?? ctx.companyId;
  const productId = await findProductIdByName(input.productName, elvCompanyId);
  const line = productId
    ? {
        product_id: productId,
        product_uom_qty: 1,
        name: input.productName,
      }
    : {
        name: input.productName,
        product_uom_qty: 1,
      };

  const orderValues: Record<string, unknown> = {
    partner_id: input.partnerId,
    origin: "Aptus Customer Portal",
    note: input.notes ?? "",
    order_line: [[0, 0, line]],
  };
  if (elvCompanyId) orderValues.company_id = elvCompanyId;

  return client.create("sale.order", orderValues);
}

export async function findPortalSaleOrders(
  partnerId: number,
  productName: string,
): Promise<number[]> {
  const client = getOdooClient();
  if (!client) return [];

  const trimmed = productName.trim();
  const orders = await client.searchRead<{ id: number; state: string }>(
    "sale.order",
    [
      ["partner_id", "=", partnerId],
      ["origin", "ilike", "Aptus Customer Portal"],
      ["state", "in", ["draft", "sent"]],
    ],
    ["id", "state"],
    20,
  );

  if (!orders.length) return [];

  const lines = await client.searchRead<{ order_id: [number, string]; name: string }>(
    "sale.order.line",
    [
      ["order_id", "in", orders.map((order) => order.id)],
      ["name", "ilike", trimmed],
    ],
    ["order_id", "name"],
    50,
  );

  const orderIds = new Set<number>();
  for (const line of lines) {
    const orderId = Array.isArray(line.order_id) ? line.order_id[0] : line.order_id;
    if (typeof orderId === "number") {
      orderIds.add(orderId);
    }
  }

  return [...orderIds];
}

export async function cancelPortalSaleOrders(orderIds: number[]): Promise<number> {
  if (!orderIds.length) return 0;

  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  let cancelled = 0;
  for (const orderId of orderIds) {
    try {
      await client.call("sale.order", "action_cancel", [[orderId]]);
      cancelled += 1;
    } catch {
      await client.write("sale.order", [orderId], { active: false });
      cancelled += 1;
    }
  }

  return cancelled;
}

/**
 * Attaches the uploaded bank-transfer payment proof to the sale order as an
 * ir.attachment and appends a note so finance can see the order is awaiting
 * manual payment verification. Does NOT confirm the order or mark it paid —
 * that stays a manual step for the finance/admin team.
 */
export async function attachBankTransferProofToSaleOrder(input: {
  saleOrderId: number;
  fileName: string;
  contentType: string;
  base64Content: string;
  bankTransferReference: string;
}): Promise<number | null> {
  const client = getOdooClient();
  if (!client) return null;

  const attachmentId = await createOdooAttachment({
    resModel: "sale.order",
    resId: input.saleOrderId,
    fileName: input.fileName,
    contentType: input.contentType,
    base64Content: input.base64Content,
  });
  if (attachmentId == null) return null;

  try {
    await client.call(
      "sale.order",
      "message_post",
      [[input.saleOrderId]],
      {
        body: `Bank transfer payment proof uploaded by customer. Reference: ${input.bankTransferReference}. Payment status: Payment Verification Pending — please review and approve manually.`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      },
    );
  } catch {
    // message_post is best-effort; the attachment + note field write below still records the state.
  }

  await client
    .write("sale.order", [input.saleOrderId], {
      note: formatPaymentPendingNote({
        bankTransferReference: input.bankTransferReference,
        attachmentId,
        fileName: input.fileName,
      }),
    })
    .catch(() => undefined);

  return attachmentId;
}

/** When sale.order create is unavailable, attach proof to the CRM lead instead. */
export async function attachBankTransferProofToLead(input: {
  leadId: number;
  fileName: string;
  contentType: string;
  base64Content: string;
  bankTransferReference: string;
}): Promise<number | null> {
  const client = getOdooClient();
  if (!client) return null;

  const attachmentId = await createOdooAttachment({
    resModel: "crm.lead",
    resId: input.leadId,
    fileName: input.fileName,
    contentType: input.contentType,
    base64Content: input.base64Content,
  });
  if (attachmentId == null) return null;

  try {
    await client.call(
      "crm.lead",
      "message_post",
      [[input.leadId]],
      {
        body: `Bank transfer payment proof uploaded by customer. Reference: ${input.bankTransferReference}. Payment status: Payment Verification Pending — please review and approve manually.`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      },
    );
  } catch {
    /* chatter is best-effort */
  }

  const noteField = getCrmLeadNotesFieldName();
  const rows = await client.read<Record<string, string | false>>(
    "crm.lead",
    [input.leadId],
    [noteField],
  );
  const existing = typeof rows[0]?.[noteField] === "string" ? rows[0][noteField] : "";
  const paymentNote = formatPaymentPendingNote({
    bankTransferReference: input.bankTransferReference,
    attachmentId,
    fileName: input.fileName,
  });
  const merged = existing.trim() ? `${existing.trim()}\n\n${paymentNote}` : paymentNote;
  await client.write("crm.lead", [input.leadId], { [noteField]: merged });

  return attachmentId;
}

/** Draft sales order created directly from a bank-transfer checkout submission (no card data involved). */
export async function createBankTransferSaleOrder(input: {
  partnerId: number;
  duration: "1year" | "3year";
  lines: PortalOrderLine[];
  bankTransferReference: string;
  orderReference?: string;
}): Promise<number> {
  return createPortalSaleOrderWithLines({
    partnerId: input.partnerId,
    duration: input.duration,
    lines: input.lines,
    orderReference: input.orderReference ?? input.bankTransferReference,
    notes: `Bank transfer checkout — payment reference ${input.bankTransferReference}. Payment status: Payment Verification Pending.`,
  });
}

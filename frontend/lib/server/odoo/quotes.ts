import { logger } from "../logger";
import { getOdooClient } from "./client";
import { getRelatedPartnerIds } from "./partner-context";
import type { PortalQuote, QuoteLifecycleStatus } from "@/types/quotes";

type OdooQuoteLeadRow = {
  id: number;
  name: string;
  email_from?: string | false;
  stage_id?: [number, string] | false;
  description?: string | false;
  create_date: string;
  write_date?: string;
  probability?: number;
  active?: boolean;
};

type OdooQuoteSaleRow = {
  id: number;
  name: string;
  state: string;
  amount_total?: number;
  date_order?: string;
  write_date?: string;
  origin?: string | false;
  client_order_ref?: string | false;
  invoice_status?: string;
  note?: string | false;
};

function stageName(stage: OdooQuoteLeadRow["stage_id"]): string {
  if (!stage || !Array.isArray(stage)) return "";
  return String(stage[1] ?? "").trim();
}

function extractQuoteRef(text: string): string | null {
  const match = text.match(/\bRQ-\d{4}-\d+\b/i);
  return match ? match[0].toUpperCase() : null;
}

function productFromLeadName(name: string): string {
  const cleaned = name
    .replace(/^Request a Quote\s*[–-]\s*/i, "")
    .replace(/\s*\(RQ-\d{4}-\d+\)\s*$/i, "")
    .trim();
  return cleaned || name || "Software quote";
}

function mapLeadStatus(stageLabel: string, probability?: number): QuoteLifecycleStatus {
  const stage = stageLabel.toLowerCase();
  if (stage.includes("lost") || stage.includes("cancel")) return "Lost";
  if (stage.includes("won") || (typeof probability === "number" && probability >= 100)) {
    return "Won";
  }
  if (
    stage.includes("proposition") ||
    stage.includes("quotation") ||
    stage.includes("quote sent") ||
    stage.includes("proposal") ||
    stage.includes("negotiation")
  ) {
    return "Quotation Sent";
  }
  return "Submitted";
}

function mapSaleStatus(row: OdooQuoteSaleRow): QuoteLifecycleStatus {
  const state = (row.state ?? "").toLowerCase();
  const invoice = (row.invoice_status ?? "").toLowerCase();
  if (state === "cancel") return "Lost";
  if (invoice === "invoiced" || state === "sale" || state === "done") {
    return "Payment Received";
  }
  if (state === "sent") return "Quotation Sent";
  if (state === "draft") return "Payment Pending";
  return "Submitted";
}

function statusRank(status: QuoteLifecycleStatus): number {
  switch (status) {
    case "Lost":
      return 0;
    case "Submitted":
      return 1;
    case "Quotation Sent":
      return 2;
    case "Payment Pending":
      return 3;
    case "Payment Received":
      return 4;
    case "Won":
      return 5;
    default:
      return 1;
  }
}

function preferStatus(a: QuoteLifecycleStatus, b: QuoteLifecycleStatus): QuoteLifecycleStatus {
  return statusRank(a) >= statusRank(b) ? a : b;
}

/**
 * Request Quote opportunities + related sale quotations for a portal partner.
 * Matches partner_id and email so older unlinked RQ leads still appear.
 */
export async function fetchPartnerQuotes(
  partnerId: number,
  partnerEmail?: string,
): Promise<PortalQuote[]> {
  const client = getOdooClient();
  if (!client) return [];

  const partnerIds = await getRelatedPartnerIds(partnerId);
  const byKey = new Map<string, PortalQuote>();

  try {
    const quoteMatch: unknown[] = [
      "|",
      ["name", "ilike", "Request a Quote"],
      ["description", "ilike", "Website – Request Quote"],
    ];

    const leadQueries: unknown[][] = [
      [["partner_id", "in", partnerIds], ...quoteMatch, ["active", "in", [true, false]]],
    ];
    if (partnerEmail?.trim()) {
      leadQueries.push([
        ["email_from", "=ilike", partnerEmail.trim()],
        ...quoteMatch,
        ["active", "in", [true, false]],
      ]);
    }

    const leadRows: OdooQuoteLeadRow[] = [];
    for (const domain of leadQueries) {
      const rows = await client.searchRead<OdooQuoteLeadRow>(
        "crm.lead",
        domain,
        [
          "name",
          "email_from",
          "stage_id",
          "description",
          "create_date",
          "write_date",
          "probability",
          "active",
        ],
        80,
      );
      leadRows.push(...rows);
    }

    const seenLeadIds = new Set<number>();
    for (const lead of leadRows) {
      if (seenLeadIds.has(lead.id)) continue;
      seenLeadIds.add(lead.id);
      const description = typeof lead.description === "string" ? lead.description : "";
      const reference =
        extractQuoteRef(`${lead.name} ${description}`) ?? `LEAD-${lead.id}`;
      const stageLabel = stageName(lead.stage_id) || "New";
      const status = mapLeadStatus(stageLabel, lead.probability);
      const key = reference.startsWith("RQ-") ? reference : `LEAD-${lead.id}`;
      byKey.set(key, {
        id: `quote-lead-${lead.id}`,
        leadId: lead.id,
        reference,
        productName: productFromLeadName(lead.name),
        status,
        stageLabel,
        createdAt: lead.create_date,
        updatedAt: lead.write_date || lead.create_date,
      });
    }
  } catch (error) {
    logger.warn("Failed to fetch Request Quote CRM leads", {
      action: "quotes.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const saleOrders = await client.searchRead<OdooQuoteSaleRow>(
      "sale.order",
      [
        ["partner_id", "in", partnerIds],
        "|",
        "|",
        ["origin", "ilike", "RQ-"],
        ["client_order_ref", "ilike", "RQ-"],
        "|",
        ["origin", "ilike", "Request Quote"],
        ["note", "ilike", "RQ-"],
      ],
      [
        "name",
        "state",
        "amount_total",
        "date_order",
        "write_date",
        "origin",
        "client_order_ref",
        "invoice_status",
        "note",
      ],
      80,
    );

    for (const sale of saleOrders) {
      const blob = `${sale.origin ?? ""} ${sale.client_order_ref ?? ""} ${sale.note ?? ""} ${sale.name}`;
      const reference = extractQuoteRef(blob) ?? sale.name;
      const status = mapSaleStatus(sale);
      const existing = byKey.get(reference);
      const updatedAt = sale.write_date || sale.date_order || new Date().toISOString();
      if (existing) {
        byKey.set(reference, {
          ...existing,
          saleOrderId: sale.id,
          status: preferStatus(existing.status, status),
          amountTotal: sale.amount_total ?? existing.amountTotal,
          updatedAt,
          stageLabel:
            status === "Quotation Sent" || status === "Payment Received"
              ? status
              : existing.stageLabel,
        });
      } else {
        byKey.set(reference, {
          id: `quote-so-${sale.id}`,
          leadId: 0,
          saleOrderId: sale.id,
          reference,
          productName: sale.name,
          status,
          stageLabel: status,
          amountTotal: sale.amount_total,
          createdAt: sale.date_order || updatedAt,
          updatedAt,
        });
      }
    }
  } catch (error) {
    logger.warn("Failed to fetch quote sale orders", {
      action: "quotes.fetch",
      partnerId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Also surface portal purchase sale.orders in "sent" as quotation updates
  // when they are not already covered (sales may send SO after RQ).
  try {
    const sentOrders = await client.searchRead<OdooQuoteSaleRow>(
      "sale.order",
      [
        ["partner_id", "in", partnerIds],
        ["state", "in", ["sent", "sale", "done"]],
        ["origin", "ilike", "Aptus Customer Portal"],
      ],
      [
        "name",
        "state",
        "amount_total",
        "date_order",
        "write_date",
        "origin",
        "client_order_ref",
        "invoice_status",
        "note",
      ],
      40,
    );

    for (const sale of sentOrders) {
      const key = sale.name;
      if (byKey.has(key)) continue;
      const status = mapSaleStatus(sale);
      byKey.set(key, {
        id: `quote-portal-so-${sale.id}`,
        leadId: 0,
        saleOrderId: sale.id,
        reference: sale.name,
        productName: sale.name,
        status,
        stageLabel: status,
        amountTotal: sale.amount_total,
        createdAt: sale.date_order || sale.write_date || new Date().toISOString(),
        updatedAt: sale.write_date || sale.date_order || new Date().toISOString(),
      });
    }
  } catch {
    // optional enrichment — ignore
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

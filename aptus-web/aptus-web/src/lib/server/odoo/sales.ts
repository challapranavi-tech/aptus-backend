import { getOdooClient } from "./client";
import { getPartnerOdooContext, resolveCrmRouting } from "./partner-context";

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
};

/** Draft sales order with multiple product lines from the portal checkout. */
export async function createPortalSaleOrderWithLines(input: {
  partnerId: number;
  duration: "1year" | "3year";
  lines: PortalOrderLine[];
  notes?: string;
}): Promise<number> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const ctx = await getPartnerOdooContext(input.partnerId);
  const softwareCompanyId = resolveCrmRouting("software").companyId ?? ctx.companyId;

  const orderLines: unknown[] = [];
  for (const line of input.lines) {
    const productId = await findProductIdByName(line.productName, softwareCompanyId);
    const label = line.category ? `${line.category} — ${line.productName}` : line.productName;
    orderLines.push([
      0,
      0,
      productId
        ? {
            product_id: productId,
            product_uom_qty: line.quantity,
            name: `${label} (${input.duration === "3year" ? "3 Year" : "1 Year"})`,
          }
        : {
            name: `${label} (${input.duration === "3year" ? "3 Year" : "1 Year"})`,
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
      await client.call("sale.order", "action_cancel", { ids: [orderId] });
      cancelled += 1;
    } catch {
      await client.write("sale.order", [orderId], { active: false });
      cancelled += 1;
    }
  }

  return cancelled;
}

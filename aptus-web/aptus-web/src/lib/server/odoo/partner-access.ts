import { getOdooClient } from "./client";

export type PartnerAccessResult = {
  allowed: boolean;
  exists: boolean;
  active: boolean;
  portalEnabled: boolean;
  reason?: "not_found" | "archived" | "portal_disabled";
};

type PartnerAccessRow = {
  id: number;
  active: boolean;
  [key: string]: unknown;
};

function portalEnabledFieldName(): string | null {
  const field = (process.env.ODOO_PORTAL_ENABLED_FIELD ?? "").trim();
  return field || null;
}

/** Validates whether an Odoo contact may use the customer portal. */
export async function checkPartnerPortalAccess(partnerId: number): Promise<PartnerAccessResult> {
  const client = getOdooClient();
  if (!client) {
    return { allowed: true, exists: true, active: true, portalEnabled: true };
  }

  const portalField = portalEnabledFieldName();
  const fields = ["active", ...(portalField ? [portalField] : [])];

  let rows: PartnerAccessRow[];
  try {
    rows = await client.read<PartnerAccessRow>("res.partner", [partnerId], fields);
  } catch {
    rows = await client.read<PartnerAccessRow>("res.partner", [partnerId], ["active"]);
  }

  const partner = rows[0];
  if (!partner) {
    return {
      allowed: false,
      exists: false,
      active: false,
      portalEnabled: false,
      reason: "not_found",
    };
  }

  const active = partner.active !== false;
  let portalEnabled = true;
  if (portalField && portalField in partner) {
    const value = partner[portalField];
    portalEnabled = value !== false && value !== 0 && value !== "false";
  }

  if (!active) {
    return {
      allowed: false,
      exists: true,
      active: false,
      portalEnabled,
      reason: "archived",
    };
  }

  if (!portalEnabled) {
    return {
      allowed: false,
      exists: true,
      active: true,
      portalEnabled: false,
      reason: "portal_disabled",
    };
  }

  return { allowed: true, exists: true, active: true, portalEnabled: true };
}

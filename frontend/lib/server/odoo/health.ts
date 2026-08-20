import { getOdooConfig, isOdooConfigured } from "../config";
import { getOdooClient } from "./client";
import { logger } from "../logger";
import { PARTNER_PORTAL_FIELDS } from "./partners";

export type OdooConnectionStatus = {
  configured: boolean;
  connected: boolean;
  mode: "demo" | "live";
  baseUrl: string | null;
  database: string | null;
  message: string;
  /** Portal Char fields on res.partner visible to the API user. */
  portalFields?: {
    present: string[];
    missing: string[];
  };
};

export async function getOdooConnectionStatus(): Promise<OdooConnectionStatus> {
  if (!isOdooConfigured()) {
    return {
      configured: false,
      connected: false,
      mode: "demo",
      baseUrl: null,
      database: null,
      message: "Odoo credentials not set — running in demo mode.",
    };
  }

  const { baseUrl, db } = getOdooConfig();
  const client = getOdooClient();

  try {
    if (!client) {
      throw new Error("Odoo client unavailable despite valid configuration");
    }
    await client.searchRead("res.partner", [["id", ">", 0]], ["name"], 1);

    let portalFields: OdooConnectionStatus["portalFields"];
    try {
      // Prefer ir.model.fields (registry truth for this DB) over fields_get, which can
      // hide fields the API user cannot access via group restrictions.
      const fieldRows = await client.searchRead<{ name: string }>(
        "ir.model.fields",
        [
          ["model", "=", "res.partner"],
          ["name", "in", [...PARTNER_PORTAL_FIELDS]],
        ],
        ["name"],
        PARTNER_PORTAL_FIELDS.length,
      );
      const found = new Set(fieldRows.map((row) => row.name));
      const present = PARTNER_PORTAL_FIELDS.filter((name) => found.has(name));
      const missing = PARTNER_PORTAL_FIELDS.filter((name) => !found.has(name));
      portalFields = { present: [...present], missing: [...missing] };
    } catch (fieldError) {
      logger.warn("Odoo portal fields lookup failed", {
        action: "odoo.health.portal_fields",
        error: fieldError instanceof Error ? fieldError.message : String(fieldError),
      });
      try {
        const fieldsGet = await client.call<Record<string, unknown>>(
          "res.partner",
          "fields_get",
          [[...PARTNER_PORTAL_FIELDS]],
          { attributes: ["type", "string"] },
        );
        const present = PARTNER_PORTAL_FIELDS.filter((name) => Boolean(fieldsGet?.[name]));
        const missing = PARTNER_PORTAL_FIELDS.filter((name) => !fieldsGet?.[name]);
        portalFields = { present: [...present], missing: [...missing] };
      } catch {
        portalFields = {
          present: [],
          missing: [...PARTNER_PORTAL_FIELDS],
        };
      }
    }

    const missingCount = portalFields.missing.length;
    return {
      configured: true,
      connected: true,
      mode: "live",
      baseUrl,
      database: db,
      message:
        missingCount === 0
          ? "Connected to Odoo staging."
          : `Connected, but ${missingCount} portal field(s) missing for the API user: ${portalFields.missing.join(", ")}`,
      portalFields,
    };
  } catch (error) {
    logger.error("Odoo health check failed", {
      action: "odoo.health.failed",
      error: error instanceof Error ? error.message : String(error),
      baseUrl,
      database: db,
    });
    return {
      configured: true,
      connected: false,
      mode: "live",
      baseUrl,
      database: db,
      message: "Unable to reach Odoo right now. Please try again shortly.",
    };
  }
}

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
  /** Login used by ODOO_USER (no secrets). */
  apiUser?: string | null;
  /** Portal Char fields on res.partner visible to the API user. */
  portalFields?: {
    present: string[];
    missing: string[];
    /** Raw rows found by name like x_portal_% (debug). */
    seenInOdoo?: Array<{ name: string; model: string }>;
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

  const { baseUrl, db, user } = getOdooConfig();
  const client = getOdooClient();

  try {
    if (!client) {
      throw new Error("Odoo client unavailable despite valid configuration");
    }
    await client.searchRead("res.partner", [["id", ">", 0]], ["name"], 1);

    let portalFields: OdooConnectionStatus["portalFields"];
    try {
      const seenRows = await client.searchRead<{ name: string; model: string }>(
        "ir.model.fields",
        [["name", "like", "x_portal_"]],
        ["name", "model"],
        20,
      );
      const seenInOdoo = seenRows.map((row) => ({
        name: row.name,
        model: row.model,
      }));
      const found = new Set(
        seenRows
          .filter((row) => row.model === "res.partner")
          .map((row) => row.name),
      );

      // Cross-check model field registry as seen by this API user.
      const fieldsGet = await client.call<Record<string, unknown>>(
        "res.partner",
        "fields_get",
        [],
        { attributes: ["type"] },
      );
      for (const name of PARTNER_PORTAL_FIELDS) {
        if (fieldsGet?.[name]) found.add(name);
      }

      const present = PARTNER_PORTAL_FIELDS.filter((name) => found.has(name));
      const missing = PARTNER_PORTAL_FIELDS.filter((name) => !found.has(name));
      portalFields = { present: [...present], missing: [...missing], seenInOdoo };
    } catch (fieldError) {
      logger.warn("Odoo portal fields lookup failed", {
        action: "odoo.health.portal_fields",
        error: fieldError instanceof Error ? fieldError.message : String(fieldError),
      });
      portalFields = {
        present: [],
        missing: [...PARTNER_PORTAL_FIELDS],
        seenInOdoo: [],
      };
    }

    const missingCount = portalFields.missing.length;
    return {
      configured: true,
      connected: true,
      mode: "live",
      baseUrl,
      database: db,
      apiUser: user || null,
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
      apiUser: user || null,
      message: "Unable to reach Odoo right now. Please try again shortly.",
    };
  }
}

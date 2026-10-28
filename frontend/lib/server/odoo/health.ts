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
  /** Safe failure class when connected is false. */
  reason?: "auth" | "timeout" | "bad_url" | "unreachable" | "rpc";
  /** Login used by ODOO_USER (no secrets). */
  apiUser?: string | null;
  /** Portal Char fields on res.partner visible to the API user. */
  portalFields?: {
    present: string[];
    missing: string[];
    /** Raw rows found by name like x_portal_% (debug). */
    seenInOdoo?: Array<{
      name: string;
      model: string;
      modelId?: [number, string] | null;
    }>;
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
      const seenRows = await client.searchRead<{
        name: string;
        model: string | false;
        model_id: [number, string] | false;
      }>(
        "ir.model.fields",
        [["name", "like", "x_portal_"]],
        ["name", "model", "model_id"],
        20,
      );
      const seenInOdoo = seenRows.map((row) => ({
        name: row.name,
        model:
          typeof row.model === "string" && row.model
            ? row.model
            : Array.isArray(row.model_id)
              ? row.model_id[1]
              : String(row.model ?? ""),
        modelId: Array.isArray(row.model_id) ? row.model_id : null,
      }));
      const found = new Set(
        seenRows
          .filter((row) => {
            const modelName =
              typeof row.model === "string" && row.model
                ? row.model
                : Array.isArray(row.model_id)
                  ? String(row.model_id[1] ?? "")
                  : "";
            return modelName === "res.partner" || /res\.partner/i.test(modelName);
          })
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
    const raw = error instanceof Error ? error.message : String(error);
    logger.error("Odoo health check failed", {
      action: "odoo.health.failed",
      error: raw,
      baseUrl,
      database: db,
    });
    const reason = /Authentication failed/i.test(raw)
      ? "auth"
      : /timed out|Timeout/i.test(raw)
        ? "timeout"
        : /HTTP 400|CSRF/i.test(raw)
          ? "bad_url"
          : /HTTP|request failed|fetch|non-JSON/i.test(raw)
            ? "unreachable"
            : "rpc";
    const message =
      reason === "auth"
        ? "Odoo rejected the API user or key. Update ODOO_USER and ODOO_API_KEY on Vercel, then redeploy."
        : reason === "bad_url"
          ? "ODOO_BASE_URL looks like a browser path. Use the host only (no /odoo), then redeploy."
          : reason === "timeout"
            ? "Odoo did not respond in time. Check the staging instance is awake, then try again."
            : "Unable to reach Odoo right now. Please try again shortly.";
    return {
      configured: true,
      connected: false,
      mode: "live",
      baseUrl,
      database: db,
      apiUser: user || null,
      reason,
      message,
    };
  }
}

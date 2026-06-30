import { getOdooConfig, isOdooConfigured } from "../config";
import { getOdooClient } from "./client";
import { logger } from "../logger";

export type OdooConnectionStatus = {
  configured: boolean;
  connected: boolean;
  mode: "demo" | "live";
  baseUrl: string | null;
  database: string | null;
  message: string;
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
    return {
      configured: true,
      connected: true,
      mode: "live",
      baseUrl,
      database: db,
      message: "Connected to Odoo staging.",
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

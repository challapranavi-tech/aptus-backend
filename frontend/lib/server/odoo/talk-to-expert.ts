import { logger } from "../logger";
import { getOdooClient } from "./client";

const DEFAULT_STAGE_NAME = "Website cold calling leads";

function positiveInt(raw: string | undefined): number | undefined {
  const n = Number(raw?.trim() ?? "");
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function talkToExpertStageIdFromEnv(): number | undefined {
  return positiveInt(process.env.ODOO_CRM_TALK_TO_EXPERT_STAGE_ID);
}

function talkToExpertTeamIdFromEnv(): number | undefined {
  return (
    positiveInt(process.env.ODOO_CRM_TALK_TO_EXPERT_TEAM_ID) ??
    positiveInt(process.env.ODOO_CRM_SOFTWARE_TEAM_ID) ??
    positiveInt(process.env.ODOO_CRM_TEAM_ID)
  );
}

function talkToExpertCompanyIdFromEnv(): number | undefined {
  return positiveInt(process.env.ODOO_SOFTWARE_COMPANY_ID);
}

function talkToExpertStageName(): string {
  return (
    process.env.ODOO_CRM_TALK_TO_EXPERT_STAGE_NAME?.trim() || DEFAULT_STAGE_NAME
  );
}

async function resolveTalkToExpertStageId(): Promise<number | undefined> {
  const fromEnv = talkToExpertStageIdFromEnv();
  if (fromEnv) return fromEnv;

  const client = getOdooClient();
  if (!client) return undefined;

  const name = talkToExpertStageName();
  const rows = await client.searchRead<{ id: number }>(
    "crm.stage",
    [["name", "=ilike", name]],
    ["id"],
    1,
  );
  return rows[0]?.id;
}

/**
 * Create a Talk to Expert opportunity in Odoo from the frontend app
 * (uses the same ODOO_* env as the customer portal).
 */
export async function createTalkToExpertLead(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ leadId: number | null; crmSynced: boolean }> {
  const client = getOdooClient();
  if (!client) {
    logger.warn("Talk to Expert: Odoo not configured on frontend", {
      action: "talk-to-expert",
    });
    return { leadId: null, crmSynced: false };
  }

  const contactName = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  const values: Record<string, unknown> = {
    name: `Talk to an Expert – ${contactName || "Website lead"}`,
    contact_name: contactName,
    partner_name: "",
    phone,
    email_from: email,
    type: "opportunity",
    description: [
      `Name: ${contactName || "—"}`,
      `Email: ${email || "—"}`,
      `Phone: ${phone || "—"}`,
      "Source: Website – Talk to an Expert",
    ].join(", "),
  };

  const companyId = talkToExpertCompanyIdFromEnv();
  if (companyId) values.company_id = companyId;

  const teamId = talkToExpertTeamIdFromEnv();
  if (teamId) values.team_id = teamId;

  try {
    const stageId = await resolveTalkToExpertStageId();
    if (stageId) values.stage_id = stageId;
    else {
      logger.warn("Talk to Expert: CRM stage not found", {
        action: "talk-to-expert",
        stageName: talkToExpertStageName(),
      });
    }
  } catch (err) {
    logger.warn("Talk to Expert: stage lookup failed", {
      action: "talk-to-expert",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const leadId = await client.create("crm.lead", values);
    logger.info("Talk to Expert CRM lead created", {
      action: "talk-to-expert",
      leadId,
      stageId: values.stage_id ?? null,
    });
    return { leadId, crmSynced: true };
  } catch (err) {
    logger.error("Talk to Expert CRM create failed", {
      action: "talk-to-expert",
      error: err instanceof Error ? err.message : String(err),
    });
    return { leadId: null, crmSynced: false };
  }
}

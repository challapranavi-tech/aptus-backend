import { logger } from "../logger";
import { getOdooClient, type OdooClient } from "./client";

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

async function resolveStageAndTeam(client: OdooClient): Promise<{
  stageId?: number;
  teamId?: number;
}> {
  const stageId = talkToExpertStageIdFromEnv();
  const envTeamId = talkToExpertTeamIdFromEnv();

  if (stageId) {
    try {
      const stages = await client.read<{
        id: number;
        team_id: [number, string] | false;
        team_ids: number[] | false;
      }>(
        "crm.stage",
        [stageId],
        ["id", "team_id", "team_ids"],
      );
      const stage = stages[0];
      if (stage) {
        const fromTeamIds =
          Array.isArray(stage.team_ids) && stage.team_ids.length > 0
            ? stage.team_ids[0]
            : undefined;
        const fromTeamId = Array.isArray(stage.team_id)
          ? stage.team_id[0]
          : undefined;
        return {
          stageId: stage.id,
          teamId: envTeamId ?? fromTeamIds ?? fromTeamId,
        };
      }
    } catch {
      /* stage read optional */
    }
    return { stageId, teamId: envTeamId };
  }

  const name = talkToExpertStageName();
  const rows = await client.searchRead<{
    id: number;
    team_id: [number, string] | false;
    team_ids: number[] | false;
  }>(
    "crm.stage",
    [["name", "=ilike", name]],
    ["id", "team_id", "team_ids"],
    1,
  );
  const stage = rows[0];
  if (!stage) return { teamId: envTeamId };

  const fromTeamIds =
    Array.isArray(stage.team_ids) && stage.team_ids.length > 0
      ? stage.team_ids[0]
      : undefined;
  const fromTeamId = Array.isArray(stage.team_id) ? stage.team_id[0] : undefined;
  return {
    stageId: stage.id,
    teamId: envTeamId ?? fromTeamIds ?? fromTeamId,
  };
}

/**
 * Create a Talk to Expert CRM lead (type=lead) in Odoo.
 * Uses the same ODOO_* env as the customer portal when available.
 */
export async function createTalkToExpertLead(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ leadId: number | null; crmSynced: boolean; error?: string }> {
  const client = getOdooClient();
  if (!client) {
    logger.warn("Talk to Expert: Odoo not configured on frontend", {
      action: "talk-to-expert",
    });
    return {
      leadId: null,
      crmSynced: false,
      error: "Odoo is not configured on the frontend.",
    };
  }

  const contactName = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  const values: Record<string, unknown> = {
    name: `Talk to an Expert – ${contactName || "Website lead"}`,
    contact_name: contactName,
    phone,
    email_from: email,
    // Leads menu (not Pipeline) — matches "Website cold calling leads" stage.
    type: "lead",
    description: [
      `Name: ${contactName || "—"}`,
      `Email: ${email || "—"}`,
      `Phone: ${phone || "—"}`,
      "Source: Website – Talk to an Expert",
    ].join(", "),
  };

  const companyId = talkToExpertCompanyIdFromEnv();
  if (companyId) values.company_id = companyId;

  try {
    const { stageId, teamId } = await resolveStageAndTeam(client);
    if (stageId) values.stage_id = stageId;
    if (teamId) values.team_id = teamId;
    if (!stageId) {
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

  const attempts: Record<string, unknown>[] = [values];
  // Fallbacks if company/stage constraints reject the create.
  if (values.company_id) {
    const { company_id: _c, ...noCompany } = values;
    attempts.push(noCompany);
  }
  if (values.stage_id) {
    const { stage_id: _s, team_id: _t, ...noStage } = values;
    attempts.push(noStage);
  }

  let lastError = "";
  for (const attempt of attempts) {
    try {
      const leadId = await client.create("crm.lead", attempt);
      logger.info("Talk to Expert CRM lead created", {
        action: "talk-to-expert",
        leadId,
        stageId: attempt.stage_id ?? null,
        teamId: attempt.team_id ?? null,
        type: attempt.type,
      });
      return { leadId, crmSynced: true };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("Talk to Expert CRM create attempt failed", {
        action: "talk-to-expert",
        error: lastError,
      });
    }
  }

  logger.error("Talk to Expert CRM create failed", {
    action: "talk-to-expert",
    error: lastError,
  });
  return { leadId: null, crmSynced: false, error: lastError };
}

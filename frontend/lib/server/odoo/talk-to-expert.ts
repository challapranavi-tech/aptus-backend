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
  stageId: number;
  teamId?: number;
}> {
  const envStageId = talkToExpertStageIdFromEnv();
  const envTeamId = talkToExpertTeamIdFromEnv();
  const stageName = talkToExpertStageName();

  // Aptus Odoo: crm.stage has team_ids only — never request legacy team_id.
  const readPlacement = async (stageId: number) => {
    const stages = await client.read<{
      id: number;
      team_ids: number[] | false;
    }>("crm.stage", [stageId], ["id", "team_ids"]);
    return stages[0];
  };

  let stage: { id: number; team_ids: number[] | false } | undefined;

  if (envStageId) {
    stage = await readPlacement(envStageId);
    if (!stage) {
      throw new Error(
        `ODOO_CRM_TALK_TO_EXPERT_STAGE_ID=${envStageId} was not found in Odoo. ` +
          `Confirm the id for "${stageName}" under CRM → Configuration → Stages.`,
      );
    }
  } else {
    const rows = await client.searchRead<{
      id: number;
      team_ids: number[] | false;
    }>(
      "crm.stage",
      [["name", "=ilike", stageName]],
      ["id", "team_ids"],
      1,
    );
    stage = rows[0];
    if (!stage) {
      throw new Error(
        `CRM stage "${stageName}" was not found. Create it on the Sales Team pipeline ` +
          `(CRM → Sales → Teams → Pipeline), then set ODOO_CRM_TALK_TO_EXPERT_STAGE_ID.`,
      );
    }
  }

  const fromTeamIds =
    Array.isArray(stage.team_ids) && stage.team_ids.length > 0
      ? stage.team_ids[0]
      : undefined;

  return {
    stageId: stage.id,
    teamId: fromTeamIds ?? envTeamId,
  };
}

/**
 * Create a Talk to Expert CRM opportunity in the Pipeline stage
 * "Website cold calling leads" (or ODOO_CRM_TALK_TO_EXPERT_STAGE_ID).
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

  let stageId: number;
  let teamId: number | undefined;
  try {
    const placement = await resolveStageAndTeam(client);
    stageId = placement.stageId;
    teamId = placement.teamId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Talk to Expert: CRM stage unresolved", {
      action: "talk-to-expert",
      error: message,
    });
    return { leadId: null, crmSynced: false, error: message };
  }

  const values: Record<string, unknown> = {
    name: `Talk to an Expert – ${contactName || "Website lead"}`,
    contact_name: contactName,
    phone,
    email_from: email,
    // Pipeline opportunity — same view as Request Quote / My Pipeline.
    type: "opportunity",
    stage_id: stageId,
    description: [
      `Name: ${contactName || "—"}`,
      `Email: ${email || "—"}`,
      `Phone: ${phone || "—"}`,
      "Source: Website – Talk to an Expert",
    ].join(", "),
  };

  if (teamId) values.team_id = teamId;

  const companyId = talkToExpertCompanyIdFromEnv();
  if (companyId) values.company_id = companyId;

  const attempts: Record<string, unknown>[] = [values];
  // Company mismatch is common; retry without company_id only.
  if (values.company_id) {
    const { company_id: _c, ...noCompany } = values;
    attempts.push(noCompany);
  }

  let lastError = "";
  for (const attempt of attempts) {
    try {
      const leadId = await client.create("crm.lead", attempt);
      try {
        await client.write("crm.lead", [leadId], {
          stage_id: stageId,
          ...(teamId ? { team_id: teamId } : {}),
        });
      } catch (writeErr) {
        logger.warn("Talk to Expert: stage re-write failed", {
          action: "talk-to-expert",
          leadId,
          error: writeErr instanceof Error ? writeErr.message : String(writeErr),
        });
      }
      logger.info("Talk to Expert CRM opportunity created", {
        action: "talk-to-expert",
        leadId,
        stageId,
        teamId: teamId ?? null,
        type: "opportunity",
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

import { getOdooClient, type OdooClient } from "./client";

export type PartnerOdooContext = {
  partnerId: number;
  email?: string;
  name?: string;
  companyId?: number;
  teamId?: number;
};

/**
 * Commercial-entity scope for portal reads.
 * Includes the login partner, its commercial parent, and sibling contacts —
 * so multi-company / multi-contact accounts share orders without a switcher UI yet.
 * Future company-switcher can filter this list instead of inventing a new fetch path.
 */
export async function getRelatedPartnerIds(partnerId: number): Promise<number[]> {
  const client = getOdooClient();
  if (!client) return [partnerId];

  const rows = await client.read<{ commercial_partner_id: [number, string] | false }>(
    "res.partner",
    [partnerId],
    ["commercial_partner_id"],
  );
  const cp = rows[0]?.commercial_partner_id;
  const commercialId = Array.isArray(cp) ? cp[0] : partnerId;

  const related = await client.searchRead<{ id: number }>(
    "res.partner",
    [["commercial_partner_id", "=", commercialId]],
    ["id"],
    100,
  );

  return [...new Set([partnerId, commercialId, ...related.map((row) => row.id)])];
}

function m2oId(value: [number, string] | false | null | undefined): number | undefined {
  return Array.isArray(value) ? value[0] : undefined;
}

function parseDefaultCompanyId(): number | undefined {
  const raw = process.env.ODOO_DEFAULT_COMPANY_ID?.trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

function parseDefaultTeamId(): number | undefined {
  const raw = process.env.ODOO_CRM_TEAM_ID?.trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

/** Partner company + default CRM sales team for multi-company Odoo instances. */
export async function getPartnerOdooContext(partnerId: number): Promise<PartnerOdooContext> {
  const client = getOdooClient();
  if (!client) throw new Error("Odoo is not configured");

  const rows = await client.read<{
    email: string | false;
    name: string | false;
    company_id: [number, string] | false;
  }>("res.partner", [partnerId], ["email", "name", "company_id"]);

  const partner = rows[0];
  const companyId = m2oId(partner?.company_id) ?? parseDefaultCompanyId();
  const teamId =
    parseDefaultTeamId() ?? (await resolveSalesTeamId(client, companyId)) ?? undefined;

  return {
    partnerId,
    email: typeof partner?.email === "string" ? partner.email.trim() || undefined : undefined,
    name: typeof partner?.name === "string" ? partner.name.trim() || undefined : undefined,
    companyId,
    teamId,
  };
}

async function resolveSalesTeamId(
  client: OdooClient,
  companyId?: number,
): Promise<number | null> {
  const buildDomain = (withCompany: boolean): unknown[] => {
    const domain: unknown[] = [["use_opportunities", "=", true]];
    if (withCompany && companyId) {
      domain.push("|", ["company_id", "=", false], ["company_id", "=", companyId]);
    }
    return domain;
  };

  let teams = await client.searchRead<{ id: number; sequence: number; name: string }>(
    "crm.team",
    buildDomain(Boolean(companyId)),
    ["id", "sequence", "name"],
    20,
  );

  if (!teams.length && companyId) {
    teams = await client.searchRead<{ id: number; sequence: number; name: string }>(
      "crm.team",
      buildDomain(false),
      ["id", "sequence", "name"],
      20,
    );
  }

  if (!teams.length) return null;
  return teams.sort((a, b) => a.sequence - b.sequence)[0]?.id ?? null;
}

/** First open pipeline stage for the sales team (prefer stage named "New"). */
export async function resolveFirstPipelineStageId(
  client: OdooClient,
  teamId: number,
): Promise<number | null> {
  const baseDomain: unknown[] = [
    ["team_ids", "in", [teamId]],
    ["is_won", "=", false],
  ];

  let stages = await client.searchRead<{ id: number; name: string; sequence: number }>(
    "crm.stage",
    baseDomain,
    ["id", "name", "sequence"],
    30,
  );

  if (!stages.length) {
    stages = await client.searchRead<{ id: number; name: string; sequence: number }>(
      "crm.stage",
      [["name", "ilike", "new"], ["is_won", "=", false]],
      ["id", "name", "sequence"],
      10,
    );
  }

  if (!stages.length) return null;

  const exactNew = stages.find((stage) => stage.name.toLowerCase() === "new");
  const picked = exactNew ?? stages.sort((a, b) => a.sequence - b.sequence)[0];
  return picked?.id ?? null;
}

export type CrmRoutingKind = "software" | "elv" | "default";

function parseEnvId(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

/** Open "New" pipeline stage — override with ODOO_CRM_NEW_STAGE_ID when needed. */
export async function resolveNewPipelineStageId(
  client: OdooClient,
  teamId?: number,
): Promise<number | null> {
  const configured = parseEnvId("ODOO_CRM_NEW_STAGE_ID");
  if (configured) return configured;

  const domain: unknown[] = [["name", "=", "New"], ["is_won", "=", false]];
  if (teamId) {
    domain.unshift("|", ["team_ids", "=", false], ["team_ids", "in", [teamId]]);
  }

  const stages = await client.searchRead<{ id: number; name: string; sequence: number }>(
    "crm.stage",
    domain,
    ["id", "name", "sequence"],
    10,
  );

  if (stages.length) {
    return stages.sort((a, b) => a.sequence - b.sequence)[0]?.id ?? null;
  }

  if (teamId) {
    return resolveFirstPipelineStageId(client, teamId);
  }

  return null;
}

/** Exact name match wins over substring; first hint wins over later hints. */
export function pickStageIdByHints(
  stages: Array<{ id: number; name: string }>,
  hints: string[],
): number | null {
  for (const hint of hints) {
    const needle = hint.toLowerCase();
    const exact = stages.find((stage) => stage.name.toLowerCase() === needle);
    if (exact) return exact.id;
    const partial = stages.find((stage) => stage.name.toLowerCase().includes(needle));
    if (partial) return partial.id;
  }
  return null;
}

/** Match an open (non-Won) crm.stage by name. Returns null when the pipeline has no such stage. */
export async function resolvePipelineStageIdByHints(
  client: OdooClient,
  hints: string[],
  teamId?: number,
): Promise<number | null> {
  if (!hints.length) return null;

  const domain: unknown[] = [["is_won", "=", false]];
  if (teamId) {
    domain.unshift("|", ["team_ids", "=", false], ["team_ids", "in", [teamId]]);
  }

  const stages = await client.searchRead<{ id: number; name: string; sequence: number }>(
    "crm.stage",
    domain,
    ["id", "name", "sequence"],
    40,
  );

  return pickStageIdByHints(stages, hints);
}

/** Route portal CRM records to the pipeline the sales team actually monitors. */
export function resolveCrmRouting(kind: CrmRoutingKind): { teamId?: number; companyId?: number } {
  if (kind === "software") {
    return {
      teamId: parseEnvId("ODOO_SOFTWARE_CRM_TEAM_ID") ?? 5,
      companyId: parseEnvId("ODOO_SOFTWARE_COMPANY_ID") ?? 2,
    };
  }
  if (kind === "elv") {
    return {
      teamId: parseEnvId("ODOO_ELV_CRM_TEAM_ID") ?? 6,
      companyId: parseEnvId("ODOO_ELV_COMPANY_ID") ?? 3,
    };
  }
  return {
    teamId: parseDefaultTeamId(),
    companyId: parseDefaultCompanyId(),
  };
}

export async function getPartnerOdooContextForCrm(
  partnerId: number,
  kind: CrmRoutingKind = "default",
): Promise<PartnerOdooContext> {
  const ctx = await getPartnerOdooContext(partnerId);
  const routing = resolveCrmRouting(kind);

  return {
    ...ctx,
    teamId: routing.teamId ?? ctx.teamId,
    companyId: routing.companyId ?? ctx.companyId,
  };
}

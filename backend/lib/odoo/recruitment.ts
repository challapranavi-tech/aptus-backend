/**
 * lib/odoo/recruitment.ts
 *
 * Pushes a career application into Odoo Recruitment as an hr.applicant with its
 * documents attached. Reuses the shared API-key JSON-RPC client (rpc.ts) — no
 * separate password login or session cookies.
 *
 * Callers treat this as best-effort: on failure it throws, and the apply route
 * logs + flags it in the HR email rather than failing the candidate.
 */
import { odooConfigFromEnv } from "./client";
import { authenticate, create, type OdooRpcSession } from "./rpc";

export interface ApplicantInput {
  candidateName: string;
  email: string;
  phone?: string;
  jobId: number;
}

export interface ApplicantAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/** Pure hr.applicant field map. Unit-tested in recruitment.check.ts. */
export function buildApplicantValues(
  input: ApplicantInput,
  stageId?: number,
): Record<string, unknown> {
  return {
    partner_name: input.candidateName,
    email_from: input.email,
    partner_phone: input.phone ?? "",
    job_id: input.jobId,
    // ponytail: no cover-letter field — this Odoo build has no `description` on
    // hr.applicant. The cover message still rides in the HR email + archive.
    // Upgrade path: post it to the applicant chatter via message_post.
    // ponytail: omit stage_id unless ODOO_APPLICANT_STAGE_ID is set — Odoo then
    // assigns the pipeline's default first stage. Stage numbering differs per
    // instance, so pinning a literal id (the old code hardcoded 1) is fragile.
    ...(stageId ? { stage_id: stageId } : {}),
  };
}

/** Parse ODOO_APPLICANT_STAGE_ID into a positive integer, or undefined. */
export function applicantStageIdFromEnv(): number | undefined {
  const n = Number(process.env.ODOO_APPLICANT_STAGE_ID?.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * Create an hr.applicant (+ ir.attachment per file). Returns the applicant id.
 * Throws on any Odoo error — the caller decides how to degrade.
 */
export async function createApplicant(
  input: ApplicantInput,
  attachments: ApplicantAttachment[],
): Promise<number> {
  const cfg = odooConfigFromEnv();
  const session: OdooRpcSession = await authenticate(
    cfg.url,
    cfg.db,
    cfg.user,
    cfg.apiKey,
    cfg.revalidate,
  );

  const applicantId = await create(
    session,
    "hr.applicant",
    buildApplicantValues(input, applicantStageIdFromEnv()),
  );
  if (!applicantId) throw new Error("Odoo returned no applicant id after create");

  for (const a of attachments) {
    await create(session, "ir.attachment", {
      name: a.filename,
      res_model: "hr.applicant",
      res_id: applicantId,
      type: "binary",
      datas: a.content.toString("base64"),
      mimetype: a.contentType ?? "application/octet-stream",
    });
  }

  return applicantId;
}

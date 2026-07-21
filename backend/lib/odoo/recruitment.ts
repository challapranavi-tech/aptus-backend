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
import { authenticate, create, OdooRpcError, type OdooRpcSession } from "./rpc";

export interface ApplicantInput {
  candidateName: string;
  email: string;
  phone?: string;
  jobId: number;
  /** Full application details (HTML) → hr.applicant.applicant_notes */
  notesHtml?: string;
  /** Parsed expected CTC → salary_expected when finite */
  salaryExpected?: number;
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
    // Full wizard payload — Odoo has no per-field map for our form; notes hold it.
    ...(input.notesHtml?.trim()
      ? { applicant_notes: input.notesHtml.trim() }
      : {}),
    ...(typeof input.salaryExpected === "number" &&
    Number.isFinite(input.salaryExpected)
      ? { salary_expected: input.salaryExpected }
      : {}),
    // ponytail: omit stage_id unless ODOO_APPLICANT_STAGE_ID is set — Odoo then
    // assigns the pipeline's default first stage. Stage numbering differs per
    // instance, so pinning a literal id (the old code hardcoded 1) is fragile.
    ...(stageId ? { stage_id: stageId } : {}),
  };
}

/** First number in a CTC string ("OMR 1,200" → 1200), else undefined. */
export function parseSalaryExpected(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse ODOO_APPLICANT_STAGE_ID into a positive integer, or undefined. */
export function applicantStageIdFromEnv(): number | undefined {
  const n = Number(process.env.ODOO_APPLICANT_STAGE_ID?.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * Sleep for `ms` milliseconds. Used for retry back-off.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential back-off when Odoo returns 429.
 * Max 3 attempts total: immediate → 1 s → 2 s.
 */
async function withOdooRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err instanceof OdooRpcError && err.httpStatus === 429;
      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s
        console.warn(
          `[odoo/recruitment] ${label} — 429 rate limit, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  // Unreachable — TypeScript needs this.
  throw new Error(`[odoo/recruitment] ${label} — all retries exhausted`);
}

/**
 * Create an hr.applicant (+ ir.attachment per file). Returns the applicant id.
 * Throws on any Odoo error — the caller decides how to degrade.
 * Retries up to 3 times with exponential back-off on HTTP 429 responses.
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

  const applicantId = await withOdooRetry(
    () =>
      create(
        session,
        "hr.applicant",
        buildApplicantValues(input, applicantStageIdFromEnv()),
      ),
    `create hr.applicant for ${input.email}`,
  );
  if (!applicantId) throw new Error("Odoo returned no applicant id after create");

  // Upload attachments sequentially with a small gap between each to avoid
  // burst-triggering Odoo's rate limiter when multiple applicants submit at once.
  for (const a of attachments) {
    await withOdooRetry(
      () =>
        create(session, "ir.attachment", {
          name: a.filename,
          res_model: "hr.applicant",
          res_id: applicantId,
          type: "binary",
          datas: a.content.toString("base64"),
          mimetype: a.contentType ?? "application/octet-stream",
        }),
      `attach ${a.filename} to applicant #${applicantId}`,
    );
    // 200 ms gap between attachment uploads — enough to stay under Odoo's
    // burst limit without meaningfully slowing down the submission.
    await sleep(200);
  }

  return applicantId;
}

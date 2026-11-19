import { hrEmail, sendEmail } from "@/lib/mail";
import { odooConfigFromEnv } from "@/lib/odoo/client";
import { authenticate, executeKw, searchRead, type OdooRpcSession } from "@/lib/odoo/rpc";
import {
  selectStageNotices,
  sentStageKeys,
  STAGE_MAIL_MARKER,
  type RecruitmentStage,
  type StageApplicant,
} from "@/lib/recruitment-stage-mail";

/** Overlap a daily cron so a missed run still mails, without re-mailing. */
const LOOKBACK_MS = 48 * 60 * 60 * 1000;
/** ponytail: one page per run. Anyone left inside the 48h window is picked up next run. */
const APPLICANT_LIMIT = 80;

interface OdooStage {
  id: number;
  name: string;
  sequence: number;
  fold?: boolean;
  template_id?: [number, string] | false;
}

interface OdooApplicant {
  id: number;
  partner_name?: string | false;
  email_from?: string | false;
  job_id?: [number, string] | false;
  stage_id?: [number, string] | false;
  refuse_reason_id?: [number, string] | false;
}

interface OdooRefuseReason {
  id: number;
  template_id?: [number, string] | false;
}

interface RenderedMail {
  subject: string;
  html: string;
  text: string;
}

interface OdooNote {
  res_id: number;
  body?: string | false;
}

export interface StageNotifyResult {
  sent: number;
  skipped: number;
  failed: number;
}

function odooStamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function many2oneName(value: unknown): string {
  if (!Array.isArray(value) || value.length < 2) return "";
  return String(value[1] ?? "").trim();
}

function many2oneId(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  const id = Number(value[0]);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

const APPLICANT_FIELDS = [
  "id",
  "partner_name",
  "email_from",
  "job_id",
  "stage_id",
  "refuse_reason_id",
];

function toApplicant(
  row: OdooApplicant,
  reasonTemplates: Map<number, number>,
  defaultRefuseTemplateId: number | null,
): StageApplicant | null {
  const stageId = many2oneId(row.stage_id);
  const email = typeof row.email_from === "string" ? row.email_from.trim() : "";
  if (!stageId || !email) return null;
  const reasonId = many2oneId(row.refuse_reason_id);
  const refuseTemplateId = reasonId
    ? reasonTemplates.get(reasonId) || defaultRefuseTemplateId
    : null;
  return {
    id: row.id,
    partnerName:
      typeof row.partner_name === "string" && row.partner_name.trim()
        ? row.partner_name.trim()
        : "Applicant",
    email,
    jobTitle: many2oneName(row.job_id) || "Role",
    stageId,
    refused: Boolean(reasonId),
    refuseTemplateId,
  };
}

async function loadStages(session: OdooRpcSession): Promise<RecruitmentStage[]> {
  const rows = await searchRead<OdooStage>(
    session,
    "hr.recruitment.stage",
    [],
    {
      fields: ["id", "name", "sequence", "fold", "template_id"],
      limit: 100,
      order: "sequence asc",
    },
  );
  return rows.map((row) => ({
    id: row.id,
    name: String(row.name ?? "").trim(),
    sequence: Number(row.sequence) || 0,
    fold: Boolean(row.fold),
    templateId: many2oneId(row.template_id) || null,
  }));
}

async function loadRefuseTemplates(
  session: OdooRpcSession,
): Promise<{ reasons: Map<number, number>; fallback: number | null }> {
  const reasons = new Map<number, number>();
  const rows = await searchRead<OdooRefuseReason>(
    session,
    "hr.applicant.refuse.reason",
    [],
    { fields: ["id", "template_id"], limit: 50 },
  );
  for (const row of rows) {
    const templateId = many2oneId(row.template_id);
    if (templateId) reasons.set(row.id, templateId);
  }
  const xmlid = await searchRead<{ res_id: number }>(
    session,
    "ir.model.data",
    [
      ["module", "=", "hr_recruitment"],
      ["name", "=", "email_template_data_applicant_refuse"],
    ],
    { fields: ["res_id"], limit: 1 },
  );
  const fallback = xmlid[0]?.res_id;
  return {
    reasons,
    fallback: Number.isInteger(fallback) && fallback > 0 ? fallback : null,
  };
}

async function loadApplicants(
  session: OdooRpcSession,
  since: string,
  reasonTemplates: Map<number, number>,
  defaultRefuseTemplateId: number | null,
): Promise<StageApplicant[]> {
  const [moved, refused] = await Promise.all([
    searchRead<OdooApplicant>(
      session,
      "hr.applicant",
      [
        ["active", "=", true],
        ["email_from", "!=", false],
        ["refuse_reason_id", "=", false],
        ["date_last_stage_update", ">=", since],
      ],
      {
        fields: APPLICANT_FIELDS,
        limit: APPLICANT_LIMIT,
        order: "date_last_stage_update asc",
      },
    ),
    // Refuse archives the card on whichever stage it was in.
    executeKw<OdooApplicant[]>(
      session,
      "hr.applicant",
      "search_read",
      [[
        ["email_from", "!=", false],
        ["refuse_reason_id", "!=", false],
        ["write_date", ">=", since],
      ]],
      {
        fields: APPLICANT_FIELDS,
        limit: APPLICANT_LIMIT,
        order: "write_date asc",
        context: { active_test: false },
      },
    ),
  ]);
  const byId = new Map<number, StageApplicant>();
  for (const row of [...moved, ...refused]) {
    const applicant = toApplicant(row, reasonTemplates, defaultRefuseTemplateId);
    if (!applicant) continue;
    const existing = byId.get(applicant.id);
    if (!existing || applicant.refused) byId.set(applicant.id, applicant);
  }
  return [...byId.values()];
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function renderedMail(raw: unknown, applicantId: number): RenderedMail | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const row = (record[String(applicantId)] ?? record) as Record<string, unknown>;
  const subject = String(row.subject ?? "").trim();
  const html = String(row.body_html ?? row.body ?? "").trim();
  if (!subject || !html) return null;
  return { subject, html, text: htmlToText(html) };
}

/** Render the Odoo template. Fall back to Odoo sending it when render fails. */
async function deliverTemplate(
  session: OdooRpcSession,
  templateId: number,
  applicantId: number,
  email: string,
): Promise<boolean> {
  try {
    const raw = await executeKw<unknown>(
      session,
      "mail.template",
      "generate_email",
      [[templateId], [applicantId]],
      { context: { active_test: false } },
    );
    const mail = renderedMail(raw, applicantId);
    if (mail) {
      const result = await sendEmail({
        to: email,
        replyTo: hrEmail(),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      if (result.ok) return true;
      console.error("[recruitment-stage] resend failed", applicantId, result.error);
    }
  } catch (err) {
    console.warn(
      "[recruitment-stage] template render failed",
      applicantId,
      err instanceof Error ? err.message : err,
    );
  }
  try {
    await executeKw(session, "mail.template", "send_mail", [[templateId], applicantId], {
      force_send: true,
      raise_exception: true,
      context: { active_test: false },
    });
    return true;
  } catch (err) {
    console.error(
      "[recruitment-stage] odoo template send failed",
      applicantId,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

async function loadSentKeys(
  session: OdooRpcSession,
  applicantIds: number[],
): Promise<Set<string>> {
  if (!applicantIds.length) return new Set();
  const notes = await searchRead<OdooNote>(
    session,
    "mail.message",
    [
      ["model", "=", "hr.applicant"],
      ["res_id", "in", applicantIds],
      ["body", "ilike", STAGE_MAIL_MARKER],
    ],
    { fields: ["res_id", "body"], limit: 400 },
  );
  return sentStageKeys(
    notes.map((note) => ({
      applicantId: note.res_id,
      body: typeof note.body === "string" ? note.body : "",
    })),
  );
}

async function markSent(
  session: OdooRpcSession,
  applicantId: number,
  marker: string,
): Promise<void> {
  await executeKw(
    session,
    "hr.applicant",
    "message_post",
    [applicantId],
    {
      body: `<p>${STAGE_MAIL_MARKER}${marker}</p>`,
      message_type: "comment",
      subtype_xmlid: "mail.mt_note",
      context: { active_test: false },
    },
  ).catch((err: unknown) => {
    console.warn(
      "[recruitment-stage] marker failed; next run may resend",
      applicantId,
      err instanceof Error ? err.message : err,
    );
  });
}

/**
 * Mail applicants whose card moved, and anyone refused on any stage.
 * Refusal and stage templates already stored in Odoo are sent as written.
 */
export async function notifyRecruitmentStageMoves(
  now = new Date(),
): Promise<StageNotifyResult> {
  const cfg = odooConfigFromEnv();
  const session = await authenticate(cfg.url, cfg.db, cfg.user, cfg.apiKey, cfg.revalidate);
  const since = odooStamp(new Date(now.getTime() - LOOKBACK_MS));
  const [stages, templates] = await Promise.all([
    loadStages(session),
    loadRefuseTemplates(session),
  ]);
  const applicants = await loadApplicants(
    session,
    since,
    templates.reasons,
    templates.fallback,
  );
  const sentKeys = await loadSentKeys(
    session,
    applicants.map((applicant) => applicant.id),
  );
  const notices = selectStageNotices(applicants, stages, sentKeys, now);
  const skipped = applicants.length - notices.length;
  let sent = 0;
  let failed = 0;

  for (const notice of notices) {
    const ok = notice.templateId
      ? await deliverTemplate(session, notice.templateId, notice.applicantId, notice.email)
      : await sendEmail({
          to: notice.email,
          replyTo: hrEmail(),
          subject: notice.mail?.subject ?? "",
          text: notice.mail?.text,
          html: notice.mail?.html,
        }).then((result) => {
          if (!result.ok) {
            console.error(
              "[recruitment-stage] mail failed",
              notice.applicantId,
              notice.marker,
              result.error,
            );
          }
          return result.ok;
        });
    if (!ok) {
      failed += 1;
      continue;
    }
    sent += 1;
    console.info("[recruitment-stage] sent", notice.applicantId, notice.marker);
    await markSent(session, notice.applicantId, notice.marker);
  }

  return { sent, skipped, failed };
}

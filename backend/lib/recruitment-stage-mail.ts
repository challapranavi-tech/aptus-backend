import { applicantReference } from "@/lib/odoo/recruitment";

/** Chatter marker so a stage congratulations email is sent once. */
export const STAGE_MAIL_MARKER = "aptus-stage-mail:";

export type StageMailKind =
  | "skip"
  | "qualify"
  | "interview"
  | "offer"
  | "hired"
  | "forward";

export interface RecruitmentStage {
  id: number;
  name: string;
  sequence: number;
  fold: boolean;
  /** mail.template on the stage, when Odoo has one. */
  templateId?: number | null;
}

export interface StageApplicant {
  id: number;
  partnerName: string;
  email: string;
  jobTitle: string;
  stageId: number;
  /** Set when Refuse was applied, whichever column the card was in. */
  refused?: boolean;
  /** mail.template from the refuse reason, or Odoo's default refusal template. */
  refuseTemplateId?: number | null;
}

export interface StageCongratsMail {
  subject: string;
  text: string;
  html: string;
}

export interface StageNotice {
  applicantId: number;
  stageId: number;
  email: string;
  /** "refuse" or the stage id. Stored on the applicant so we send once. */
  marker: string;
  /** When set, send this Odoo mail.template instead of `mail`. */
  templateId: number | null;
  mail: StageCongratsMail | null;
}

const INTAKE_NAME =
  /^(new|inbox|initial|applied|application|new application)$/;

function stageKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Intake and refusal columns do not get a congratulations email. */
export function stageMailKind(stageName: string): StageMailKind {
  const name = stageKey(stageName);
  if (!name || INTAKE_NAME.test(name)) return "skip";
  if (/\b(refus|reject|archiv|declin)/.test(name)) return "skip";
  if (name.includes("qualif") || name.includes("shortlist")) return "qualify";
  if (name.includes("interview")) return "interview";
  if (/hired|contract signed|joined/.test(name)) return "hired";
  if (/\b(offer|proposal)\b/.test(name)) return "offer";
  return "forward";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stageSentence(kind: StageMailKind, stageName: string): string {
  switch (kind) {
    case "qualify":
      return "Congratulations, you have been shortlisted.";
    case "interview":
      return `Congratulations. You have been selected for the ${stageName}. We will share the schedule with you.`;
    case "offer":
      return `Congratulations. Your application has reached ${stageName}. We will share the offer details with you.`;
    case "hired":
      return `Congratulations, and welcome to Aptus Infotech. Your application is now at ${stageName}. We will share your joining details with you.`;
    default:
      return `Congratulations. Your application has moved forward to ${stageName}.`;
  }
}

export function buildStageCongratsMail(
  input: {
    candidateName: string;
    role: string;
    stageName: string;
    reference: string;
  },
): StageCongratsMail | null {
  const kind = stageMailKind(input.stageName);
  if (kind === "skip") return null;
  const sentence = stageSentence(kind, input.stageName);
  const subject =
    kind === "qualify"
      ? `Congratulations, you have been shortlisted — ${input.reference}`
      : `Congratulations — ${input.stageName} — ${input.reference}`;
  const text = [
    `Dear ${input.candidateName},`,
    "",
    sentence,
    `This is for your ${input.role} application.`,
    `Your applicant reference is ${input.reference}.`,
    "",
    "Our HR team will contact you about the next step.",
    "",
    "Best regards,",
    "Aptus Infotech HR",
  ].join("\n");
  const html = `
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Dear ${escapeHtml(input.candidateName)},
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      ${escapeHtml(sentence)}
      This is for your <strong>${escapeHtml(input.role)}</strong> application.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Your applicant reference is <strong>${escapeHtml(input.reference)}</strong>.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#475569">
      Our HR team will contact you about the next step.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
      Best regards,<br/>Aptus Infotech HR
    </p>`;
  return { subject, text, html };
}

function notice(input: {
  applicant: StageApplicant;
  stageId: number;
  marker: string;
  templateId: number | null;
  mail: StageCongratsMail | null;
}): StageNotice {
  return {
    applicantId: input.applicant.id,
    stageId: input.stageId,
    email: input.applicant.email,
    marker: input.marker,
    templateId: input.templateId,
    mail: input.mail,
  };
}

/**
 * One notice per applicant. A refusal at any stage sends Odoo's refusal
 * template. Other moves send the stage template when Odoo has one, and
 * otherwise the shortlist / interview text. The first column is the
 * application inbox — that mail is the thank-you, not this one.
 */
export function selectStageNotices(
  applicants: StageApplicant[],
  stages: RecruitmentStage[],
  sentKeys: ReadonlySet<string>,
  now = new Date(),
): StageNotice[] {
  if (!stages.length) return [];
  const intake = Math.min(...stages.map((stage) => stage.sequence));
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  const notices: StageNotice[] = [];
  for (const applicant of applicants) {
    if (!applicant.email.includes("@")) continue;
    if (applicant.refused) {
      if (sentKeys.has(`${applicant.id}:refuse`)) continue;
      if (!applicant.refuseTemplateId) continue;
      notices.push(
        notice({
          applicant,
          stageId: applicant.stageId,
          marker: "refuse",
          templateId: applicant.refuseTemplateId,
          mail: null,
        }),
      );
      continue;
    }
    const stage = byId.get(applicant.stageId);
    if (!stage || stage.sequence === intake) continue;
    if (sentKeys.has(`${applicant.id}:${stage.id}`)) continue;
    if (stage.templateId) {
      notices.push(
        notice({
          applicant,
          stageId: stage.id,
          marker: String(stage.id),
          templateId: stage.templateId,
          mail: null,
        }),
      );
      continue;
    }
    if (stage.fold || stageMailKind(stage.name) === "skip") continue;
    const reference = applicantReference(applicant.id, applicant.jobTitle, now);
    const mail = buildStageCongratsMail({
      candidateName: applicant.partnerName || "Applicant",
      role: applicant.jobTitle,
      stageName: stage.name,
      reference,
    });
    if (!mail) continue;
    notices.push(
      notice({
        applicant,
        stageId: stage.id,
        marker: String(stage.id),
        templateId: null,
        mail,
      }),
    );
  }
  return notices;
}

/** Pull stage ids out of chatter notes from earlier runs. */
export function sentStageKeys(
  notes: Array<{ applicantId: number; body: string }>,
): Set<string> {
  const keys = new Set<string>();
  const marker = new RegExp(`${STAGE_MAIL_MARKER}([a-z0-9]+)`, "g");
  for (const note of notes) {
    for (const match of note.body.matchAll(marker)) {
      keys.add(`${note.applicantId}:${match[1]}`);
    }
  }
  return keys;
}

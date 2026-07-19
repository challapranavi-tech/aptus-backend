/**
 * Best-effort resume text → field hints.
 * No parser deps — works on extracted plain text only.
 */

import { PHONE_RE } from "./schema";

// Unanchored variants for scanning free text (schema's EMAIL_RE is anchored).
const EMAIL_SCAN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const EMAIL_LINE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ResumeHints {
  fullName?: string;
  email?: string;
  phone?: string;
  education?: Array<{ name: string; institution?: string; year?: string }>;
  experienceYears?: string;
  autoFilledKeys: string[];
}

const NAME_SKIP =
  /^(curriculum\s*vitae|resume|cv|biodata|profile|personal\s*details|contact|objective|summary|experience|education|skills)\b/i;

function looksLikeName(line: string): boolean {
  if (NAME_SKIP.test(line) || EMAIL_LINE.test(line) || /\d{3,}/.test(line))
    return false;
  if (!/^[A-Za-z][A-Za-z .'-]{1,60}$/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 5;
}

function pickPhone(cleaned: string): string | undefined {
  // Prefer an explicit international number (+cc …) over bare digit runs
  // (which often match year ranges like 2016-2020).
  const intl = cleaned.match(/\+\d{1,3}[\s().-]*\d(?:[\s().-]*\d){6,13}/);
  if (intl) {
    const phone = intl[0].replace(/\s+/g, " ").trim();
    if (PHONE_RE.test(phone) || phone.replace(/\D/g, "").length >= 8)
      return phone;
  }
  const bare = cleaned.match(
    /(?:\b(?:tel|phone|mobile|mob|cell)\b[:\s]*)(\+?\d[\d\s().-]{7,18}\d)/i,
  );
  if (bare) {
    const phone = bare[1].replace(/\s+/g, " ").trim();
    if (phone.replace(/\D/g, "").length >= 8) return phone;
  }
  const fallback = cleaned.match(
    /(?:\+?\d{1,3}[\s().-]*)?(?:\d[\s().-]*){7,14}/,
  );
  if (fallback) {
    const phone = fallback[0].replace(/\s+/g, " ").trim();
    const digits = phone.replace(/\D/g, "");
    // Reject pure year-looking spans (e.g. 2016-2020 → 20162020).
    if (/^20\d{6}$/.test(digits) || /^19\d{6}$/.test(digits)) return undefined;
    if (PHONE_RE.test(phone) || digits.length >= 8) return phone;
  }
  return undefined;
}

export function extractResumeHints(text: string): ResumeHints {
  const cleaned = text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
  const autoFilledKeys: string[] = [];
  const hints: ResumeHints = { autoFilledKeys };

  const emailMatch = cleaned.match(EMAIL_SCAN);
  if (emailMatch) {
    hints.email = emailMatch[0].toLowerCase();
    autoFilledKeys.push("email");
  }

  const phone = pickPhone(cleaned);
  if (phone) {
    hints.phone = phone;
    autoFilledKeys.push("phone");
  }

  // Name: labeled line, then first header-looking line (PDF text is often sparse).
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const labeled = cleaned.match(
    /\b(?:full\s*)?name\s*[:\-]\s*([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){1,4})(?=\s*(?:$|[|,]|\b(?:email|phone|mobile|mob|tel|cell|address)\b))/i,
  );
  if (labeled && looksLikeName(labeled[1].trim())) {
    hints.fullName = labeled[1].trim();
    autoFilledKeys.push("fullName");
  } else {
    for (const line of lines.slice(0, 12)) {
      const stripped = line.replace(/^(?:full\s*)?name\s*[:\-]\s*/i, "").trim();
      if (looksLikeName(stripped)) {
        hints.fullName = stripped;
        autoFilledKeys.push("fullName");
        break;
      }
    }
  }

  // Experience — try several common phrasings, take the first hit.
  const expPatterns: RegExp[] = [
    /(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp\b)/i,
    /(?:experience|exp)\s*(?:of|:)?\s*(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/i,
    /(?:over|more than)\s+(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i,
    /(\d{1,2})\s*\+\s*(?:years?|yrs?)/i,
  ];
  for (const re of expPatterns) {
    const m = cleaned.match(re);
    if (m) {
      hints.experienceYears = m[1];
      autoFilledKeys.push("experience");
      break;
    }
  }

  // Education — degree keyword, optional year, optional nearby institution.
  const edu: ResumeHints["education"] = [];
  const seen = new Set<string>();
  const degreeRe =
    /((?:B\.?Tech|B\.?E\.?|M\.?Tech|M\.?Sc|B\.?Sc|B\.?Com|M\.?Com|BBA|MBA|BCA|MCA|Ph\.?D|Bachelor(?:'s)?|Master(?:'s)?|Diploma)[A-Za-z.&,\s]{0,60}?)(?:.{0,60}?\b(University|College|Institute|School|Academy)[A-Za-z.&,\s]{0,40})?(?:.{0,20}?((?:19|20)\d{2}))?/gi;
  let m: RegExpExecArray | null;
  while ((m = degreeRe.exec(cleaned)) && edu.length < 5) {
    const name = m[1].replace(/\s+/g, " ").trim().replace(/[,&\s]+$/, "");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    edu.push({
      name,
      institution: m[2] ? m[0].match(/\b(?:[A-Za-z.&]+\s){0,4}(?:University|College|Institute|School|Academy)/i)?.[0]?.trim() : undefined,
      year: m[3] ?? "",
    });
  }
  if (edu.length) {
    hints.education = edu;
    autoFilledKeys.push("education");
  }

  return hints;
}

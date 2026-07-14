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

export function extractResumeHints(text: string): ResumeHints {
  const cleaned = text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
  const autoFilledKeys: string[] = [];
  const hints: ResumeHints = { autoFilledKeys };

  const emailMatch = cleaned.match(EMAIL_SCAN);
  if (emailMatch) {
    hints.email = emailMatch[0].toLowerCase();
    autoFilledKeys.push("email");
  }

  const phoneMatch = cleaned.match(
    /(?:\+?\d{1,3}[\s().-]*)?(?:\d[\s().-]*){7,14}/,
  );
  if (phoneMatch) {
    const phone = phoneMatch[0].replace(/\s+/g, " ").trim();
    if (PHONE_RE.test(phone) || phone.replace(/\D/g, "").length >= 8) {
      hints.phone = phone;
      autoFilledKeys.push("phone");
    }
  }

  // First non-empty line that looks like a name (2–4 words, letters).
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (EMAIL_LINE.test(line) || /\d{5,}/.test(line)) continue;
    if (/^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line)) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        hints.fullName = line;
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

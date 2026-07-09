import { loadLocalPageSectionsJson } from "@/lib/odoo/local-page-json";
import type { CaseStudiesPageContent } from "@/types/case-studies-page";

function parseCaseStudiesJson(raw: string): CaseStudiesPageContent | null {
  try {
    const data = JSON.parse(raw) as CaseStudiesPageContent;
    if (!data.hero || !data.caseStudies) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Load typed case-studies content.
 * Priority: Odoo JSON (when provided) → local disk JSON (dev fallback).
 */
export function loadCaseStudiesPageContent(
  odooJson?: string | false | null,
): CaseStudiesPageContent | null {
  // Odoo is the source of truth — use it when available
  if (odooJson && typeof odooJson === "string") {
    const content = parseCaseStudiesJson(odooJson);
    if (content) return content;
  }
  // Local disk JSON — fallback for dev when not yet seeded to Odoo
  const local = loadLocalPageSectionsJson("aptus-case-studies");
  if (local) return parseCaseStudiesJson(local);
  return null;
}

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

/** Load typed case-studies JSON from disk (dev) or Odoo field string. */
export function loadCaseStudiesPageContent(
  odooJson?: string | false | null,
): CaseStudiesPageContent | null {
  const local = loadLocalPageSectionsJson("aptus-case-studies");
  if (local) {
    const content = parseCaseStudiesJson(local);
    if (content) return content;
  }
  if (odooJson && typeof odooJson === "string") {
    return parseCaseStudiesJson(odooJson);
  }
  return null;
}

/**
 * Solutions in Action (/customer-stories) from committed frontend/content/case-studies.json.
 * Mirrors build-local-home-page — frontend deploy must not depend on backend/Odoo for key projects.
 */

import type { CaseStudiesPageContent } from "@/types/case-studies-page";
import caseStudiesJson from "@/content/case-studies.json";

export function buildLocalCaseStudiesPageContent(): CaseStudiesPageContent | null {
  try {
    const data = caseStudiesJson as CaseStudiesPageContent;
    if (!data.hero || !data.caseStudies) return null;
    return data;
  } catch {
    return null;
  }
}

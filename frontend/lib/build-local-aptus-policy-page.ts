/**
 * Aptus Policy / Legal & Policies from frontend/content/aptus-policy.json.
 * Same pattern as home / our-story — ships on frontend Vercel deploy.
 */

import type { LegalPolicies, LegalPolicyBlock, LegalPolicySection, Page } from "@/types";
import aptusPolicyJson from "@/content/aptus-policy.json";

type RawBlock = {
  id?: string;
  number?: string;
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
  numberedList?: string[];
  closingParagraphs?: string[];
  subsections?: RawBlock[];
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function mapBlock(block: RawBlock): LegalPolicyBlock {
  return {
    id: block.id,
    number: block.number,
    title: block.title,
    paragraphs: block.paragraphs,
    bullets: asStringArray(block.bullets),
    numberedList: asStringArray(block.numberedList),
    closingParagraphs: asStringArray(block.closingParagraphs),
  };
}

function mapSection(section: RawBlock & { id: string; number: string; title: string }): LegalPolicySection {
  return {
    id: section.id,
    number: section.number,
    title: section.title,
    paragraphs: section.paragraphs,
    bullets: asStringArray(section.bullets),
    numberedList: asStringArray(section.numberedList),
    closingParagraphs: asStringArray(section.closingParagraphs),
    subsections: Array.isArray(section.subsections)
      ? section.subsections.map((sub) => mapBlock(sub))
      : undefined,
  };
}

export function buildLocalAptusPolicyPage(): Page | null {
  const raw = aptusPolicyJson.legalPolicies;
  if (!raw?.title) return null;

  const data: LegalPolicies = {
    type: "legal-policies",
    title: raw.title,
    sections: raw.sections?.map((section) => mapSection(section as RawBlock & { id: string; number: string; title: string })),
  };

  return {
    id: "local:aptus-policy",
    slug: "aptus-policy",
    title: "Our Policies & Terms",
    seo: {
      title: "Our Policies & Terms | Aptus Infotech",
      description:
        "Aptus Infotech Our Policies & Terms covering website use, orders, software licences, privacy, cookies, and related terms.",
    },
    sections: [
      {
        id: "legal-policies",
        type: "legal-policies",
        order: 1,
        data,
      },
    ],
  };
}

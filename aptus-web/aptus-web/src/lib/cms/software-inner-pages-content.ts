import {
  AUTODESK_INNER_PAGE_DEFS,
  type AutodeskInnerPageKey,
} from "@/lib/cms/autodesk-inner-registry";
import {
  ORACLE_INNER_PAGE_DEFS,
  type OracleInnerPageKey,
} from "@/lib/cms/oracle-inner-registry";
import {
  MICROSOFT_INNER_PAGE_DEFS,
  type MicrosoftInnerPageKey,
} from "@/lib/cms/microsoft-inner-registry";
import type { SoftwareCategoryKey } from "@/lib/cms/software-pages-content";
import type { MarketingPageContent } from "@/types/marketing-page";

export type SoftwareInnerPageKey =
  | "etap"
  | "adobeBusinessCreative"
  | "adobeAcrobatPro"
  | "adobeIllustrator"
  | "adobePhotoshop"
  | "adobePremierePro"
  | AutodeskInnerPageKey
  | OracleInnerPageKey
  | MicrosoftInnerPageKey;

type InnerPageDef = {
  key: SoftwareInnerPageKey;
  category: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  description: string;
  intro: string;
};

const INNER_PAGE_DEFS: InnerPageDef[] = [
  {
    key: "etap",
    category: "electricalSoftware",
    path: "/etap_new",
    odooUrl: "/etap",
    odooPageId: Number(process.env.ODOO_CMS_ETAP_PAGE_ID || 280),
    label: "ETAP",
    description:
      "ETAP electrical power system analysis, design, and operation software for utilities, industrials, and consultants in Oman.",
    intro:
      "Aptus Infotech supplies genuine ETAP licenses with expert consultation, implementation, and support. ETAP is used worldwide for load flow, short circuit, arc flash, protection coordination, and power system modeling.",
  },
  {
    key: "adobeBusinessCreative",
    category: "adobe",
    path: "/adobe-business-creative-solutions",
    odooUrl: "/adobe-business-creative-solutions",
    odooPageId: 254,
    label: "Adobe Business & Creative Solutions",
    description:
      "Adobe Business and Creative Cloud solutions for teams — licensing, deployment, and support in Oman.",
    intro:
      "Aptus Infotech helps organizations adopt Adobe Business and Creative Cloud with the right plans for design, document, and marketing teams — including volume licensing and admin support.",
  },
  {
    key: "adobeAcrobatPro",
    category: "adobe",
    path: "/adobe-acrobat-pro",
    odooUrl: "/adobe-acrobat-pro",
    odooPageId: 255,
    label: "Adobe Acrobat Pro",
    description:
      "Adobe Acrobat Pro for PDF creation, editing, e-signatures, and secure document workflows.",
    intro:
      "Get genuine Adobe Acrobat Pro licenses from Aptus Infotech with guidance on deployment, Acrobat Sign integration, and team rollouts across your organization.",
  },
  {
    key: "adobeIllustrator",
    category: "adobe",
    path: "/adobe-illustrator",
    odooUrl: "/adobe-illustrator",
    odooPageId: 256,
    label: "Adobe Illustrator",
    description:
      "Adobe Illustrator vector design software for branding, illustration, and print production.",
    intro:
      "Aptus Infotech supplies Adobe Illustrator as part of Creative Cloud or standalone licensing, with implementation support for creative and marketing teams.",
  },
  {
    key: "adobePhotoshop",
    category: "adobe",
    path: "/adobe-photoshop",
    odooUrl: "/adobe-photoshop",
    odooPageId: 257,
    label: "Adobe Photoshop",
    description:
      "Adobe Photoshop for professional image editing, compositing, and digital design.",
    intro:
      "License Adobe Photoshop through Aptus Infotech — authorized Adobe partner in Oman — with expert advice on Creative Cloud plans and team deployment.",
  },
  {
    key: "adobePremierePro",
    category: "adobe",
    path: "/adobe-premiere-pro",
    odooUrl: "/adobe-premiere-pro",
    odooPageId: 258,
    label: "Adobe Premiere Pro",
    description:
      "Adobe Premiere Pro professional video editing for broadcast, corporate, and creative production.",
    intro:
      "Aptus Infotech provides Premiere Pro licensing and support for video teams, from single seats to enterprise Creative Cloud for teams deployments.",
  },
  ...AUTODESK_INNER_PAGE_DEFS,
  ...ORACLE_INNER_PAGE_DEFS,
  ...MICROSOFT_INNER_PAGE_DEFS,
];

export type SoftwareInnerPageConfig = {
  key: SoftwareInnerPageKey;
  category: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  title: string;
  description: string;
};

function buildInnerPageConfig(def: InnerPageDef): SoftwareInnerPageConfig {
  return {
    key: def.key,
    category: def.category,
    path: def.path,
    odooUrl: def.odooUrl,
    odooPageId: def.odooPageId,
    label: def.label,
    title: `${def.label} | Aptus Infotech`,
    description: def.description,
  };
}

function buildInnerPageDefault(def: InnerPageDef): MarketingPageContent {
  const config = buildInnerPageConfig(def);

  return {
    metaTitle: config.title,
    metaDescription: config.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: config.label },
      subtitle: def.description,
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [def.intro],
    },
    showContactCta: true,
  };
}

export const SOFTWARE_INNER_PAGES: Record<SoftwareInnerPageKey, SoftwareInnerPageConfig> =
  Object.fromEntries(
    INNER_PAGE_DEFS.map((def) => [def.key, buildInnerPageConfig(def)]),
  ) as Record<SoftwareInnerPageKey, SoftwareInnerPageConfig>;

export const DEFAULT_SOFTWARE_INNER_PAGE_CONTENT: Record<
  SoftwareInnerPageKey,
  MarketingPageContent
> = Object.fromEntries(
  INNER_PAGE_DEFS.map((def) => [def.key, buildInnerPageDefault(def)]),
) as Record<SoftwareInnerPageKey, MarketingPageContent>;

export function getSoftwareInnerPageKeysForCategory(
  category: SoftwareCategoryKey,
): SoftwareInnerPageKey[] {
  return INNER_PAGE_DEFS.filter((def) => def.category === category).map((def) => def.key);
}

export function getSoftwareInnerPageKeyBySlug(slugPath: string): SoftwareInnerPageKey | null {
  const normalized = slugPath.replace(/^\//, "");
  const match = INNER_PAGE_DEFS.find((def) => def.path.replace(/^\//, "") === normalized);
  return match?.key ?? null;
}

export function isAutodeskInnerPageKey(key: SoftwareInnerPageKey): boolean {
  return SOFTWARE_INNER_PAGES[key]?.category === "autodesk";
}

export function isOracleInnerPageKey(key: SoftwareInnerPageKey): boolean {
  return SOFTWARE_INNER_PAGES[key]?.category === "oracle";
}

export function isMicrosoftInnerPageKey(key: SoftwareInnerPageKey): boolean {
  return SOFTWARE_INNER_PAGES[key]?.category === "microsoft";
}

export function isAdobeInnerPageKey(key: SoftwareInnerPageKey): boolean {
  return SOFTWARE_INNER_PAGES[key]?.category === "adobe";
}

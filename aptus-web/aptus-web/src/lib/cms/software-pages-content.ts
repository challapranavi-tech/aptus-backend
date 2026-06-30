import type { SiteNavLink } from "@/lib/cms/site-nav";
import { NAV_ITEMS } from "@/lib/cms/site-nav";
import type { MarketingPageContent } from "@/types/marketing-page";

export type SoftwareCategoryKey =
  | "autodesk"
  | "electricalSoftware"
  | "adobe"
  | "oracle"
  | "microsoft"
  | "multimedia"
  | "quantityTakeoff"
  | "structuralSoftware"
  | "cyberSecurity"
  | "educationalSoftware"
  | "edms";

export type SoftwareCategoryConfig = {
  key: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  navLabel: string;
  title: string;
  description: string;
};

/** Top-level Software menu categories — build these before inner product pages. */
export const SOFTWARE_CATEGORY_ORDER: SoftwareCategoryKey[] = [
  "autodesk",
  "electricalSoftware",
  "adobe",
  "oracle",
  "microsoft",
  "multimedia",
  "quantityTakeoff",
  "structuralSoftware",
  "cyberSecurity",
  "educationalSoftware",
  "edms",
];

const CATEGORY_COPY: Record<
  SoftwareCategoryKey,
  { description: string; intro: string }
> = {
  autodesk: {
    description:
      "Autodesk design and engineering software for architecture, engineering, and construction professionals in Oman.",
    intro:
      "As an authorized Autodesk partner, Aptus Infotech delivers genuine licenses, implementation, and support for the full Autodesk portfolio — from AutoCAD and Revit to BIM and construction cloud solutions.",
  },
  electricalSoftware: {
    description:
      "Electrical design, analysis, and documentation software for power systems professionals in Oman.",
    intro:
      "We supply specialized electrical engineering software with expert licensing guidance, deployment, and after-sales support for utilities, contractors, and consultants.",
  },
  adobe: {
    description:
      "Adobe Creative Cloud and business solutions for design, video, document, and digital experience teams.",
    intro:
      "Aptus Infotech provides Adobe licensing and support for creative and business teams — from Acrobat and Photoshop to full Creative Cloud deployments.",
  },
  oracle: {
    description:
      "Oracle Primavera, Aconex, and enterprise project solutions for construction and engineering teams.",
    intro:
      "We help project-driven organizations adopt Oracle solutions for planning, collaboration, and document control with genuine licensing and local expertise.",
  },
  microsoft: {
    description:
      "Microsoft 365, Visio, Power BI, and productivity solutions for businesses in Oman.",
    intro:
      "From Microsoft 365 to Power BI and Visio, Aptus Infotech helps organizations license, deploy, and support the Microsoft tools their teams rely on every day.",
  },
  multimedia: {
    description:
      "Multimedia, visualization, and design software including SketchUp, V-Ray, Enscape, and more.",
    intro:
      "Our multimedia portfolio covers rendering, visualization, PDF, and 3D design tools for architects, designers, and creative studios across the GCC.",
  },
  quantityTakeoff: {
    description:
      "Quantity takeoff and construction estimating software for accurate cost planning.",
    intro:
      "We provide quantity surveying and takeoff solutions that help estimators and contractors produce accurate bills of quantities and competitive bids.",
  },
  structuralSoftware: {
    description:
      "Structural analysis and design software for engineering consultancies and contractors.",
    intro:
      "Aptus Infotech supports structural engineers with licensed analysis and design tools, implementation guidance, and ongoing technical support.",
  },
  cyberSecurity: {
    description:
      "Cyber security solutions from Fortinet, Sophos, Kaspersky, Palo Alto, and more.",
    intro:
      "Protect your organization with enterprise-grade firewalls, endpoint security, and threat management solutions backed by Aptus implementation and support.",
  },
  educationalSoftware: {
    description:
      "Educational and research software for universities, schools, and training institutions.",
    intro:
      "We supply academic licensing and support for engineering, research, and learning tools used by educational institutions across Oman.",
  },
  edms: {
    description:
      "Engineering document management systems for construction and project teams.",
    intro:
      "Streamline project documentation with EDMS platforms that connect teams, drawings, and workflows — from construction cloud to dedicated document control systems.",
  },
};

const CATEGORY_REGISTRY: Record<
  SoftwareCategoryKey,
  Omit<SoftwareCategoryConfig, "label" | "title" | "description">
> = {
  autodesk: {
    key: "autodesk",
    path: "/autodesk",
    odooUrl: "/autodesk",
    odooPageId: 162,
    navLabel: "Autodesk",
  },
  electricalSoftware: {
    key: "electricalSoftware",
    path: "/electrical-software",
    odooUrl: "/electrical-software",
    odooPageId: 278,
    navLabel: "Electrical Software",
  },
  adobe: {
    key: "adobe",
    path: "/adobe",
    odooUrl: "/adobe",
    odooPageId: 177,
    navLabel: "Adobe",
  },
  oracle: {
    key: "oracle",
    path: "/oracle",
    odooUrl: "/oracle",
    odooPageId: 279,
    navLabel: "Oracle",
  },
  microsoft: {
    key: "microsoft",
    path: "/microsoft",
    odooUrl: "/microsoft",
    odooPageId: 178,
    navLabel: "Microsoft",
  },
  multimedia: {
    key: "multimedia",
    path: "/multimedia-software-solutions",
    odooUrl: "/multimedia-software-solutions",
    odooPageId: 180,
    navLabel: "Multimedia",
  },
  quantityTakeoff: {
    key: "quantityTakeoff",
    path: "/quantity-takeoff",
    odooUrl: "/quantity-takeoff",
    odooPageId: 0,
    navLabel: "Quantity Takeoff",
  },
  structuralSoftware: {
    key: "structuralSoftware",
    path: "/structural-software",
    odooUrl: "/structural-software",
    odooPageId: 0,
    navLabel: "Structural Software",
  },
  cyberSecurity: {
    key: "cyberSecurity",
    path: "/cyber-security-solution",
    odooUrl: "/cyber-security-solution",
    odooPageId: 179,
    navLabel: "Cyber Security Solutions",
  },
  educationalSoftware: {
    key: "educationalSoftware",
    path: "/educational-software",
    odooUrl: "/educational-software",
    odooPageId: 0,
    navLabel: "Educational Software",
  },
  edms: {
    key: "edms",
    path: "/edms",
    odooUrl: "/edms",
    odooPageId: 0,
    navLabel: "EDMS",
  },
};

function getSoftwareNavChild(navLabel: string): SiteNavLink | undefined {
  const software = NAV_ITEMS.find((item) => item.href === "/software");
  return software?.children?.find((child) => child.label === navLabel);
}

function collectProductCards(node: SiteNavLink): { title: string; body: string }[] {
  const cards: { title: string; body: string }[] = [];

  function walk(item: SiteNavLink) {
    if (item.href && !item.children?.length) {
      cards.push({
        title: item.label,
        body: `Licensed ${item.label} with sales, implementation, and support from Aptus Infotech.`,
      });
      return;
    }
    item.children?.forEach(walk);
  }

  walk(node);
  return cards;
}

function buildCategoryDefault(config: SoftwareCategoryConfig): MarketingPageContent {
  const copy = CATEGORY_COPY[config.key];
  const navNode = getSoftwareNavChild(config.navLabel);
  const productCards = navNode ? collectProductCards(navNode) : [];

  return {
    metaTitle: config.title,
    metaDescription: config.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { accent: config.label },
      subtitle: copy.description,
    },
    intro: {
      id: "intro",
      visible: true,
      paragraphs: [copy.intro],
    },
    cards: productCards.length
      ? {
          id: "products",
          visible: true,
          eyebrow: "Products",
          title: { before: "Solutions in", accent: config.label },
          align: "center",
          items: productCards,
        }
      : undefined,
    showContactCta: true,
  };
}

function buildCategoryConfig(key: SoftwareCategoryKey): SoftwareCategoryConfig {
  const base = CATEGORY_REGISTRY[key];
  const copy = CATEGORY_COPY[key];

  return {
    ...base,
    label: base.navLabel,
    title: `${base.navLabel} | Aptus Infotech`,
    description: copy.description,
  };
}

export const SOFTWARE_CATEGORIES: Record<SoftwareCategoryKey, SoftwareCategoryConfig> =
  Object.fromEntries(
    SOFTWARE_CATEGORY_ORDER.map((key) => [key, buildCategoryConfig(key)]),
  ) as Record<SoftwareCategoryKey, SoftwareCategoryConfig>;

/** @deprecated Use SOFTWARE_CATEGORIES — kept for catch-all slug handler. */
export const SOFTWARE_PAGES = SOFTWARE_CATEGORIES;

export const DEFAULT_SOFTWARE_CATEGORY_CONTENT: Record<
  SoftwareCategoryKey,
  MarketingPageContent
> = Object.fromEntries(
  SOFTWARE_CATEGORY_ORDER.map((key) => [
    key,
    buildCategoryDefault(buildCategoryConfig(key)),
  ]),
) as Record<SoftwareCategoryKey, MarketingPageContent>;

/** @deprecated Use DEFAULT_SOFTWARE_CATEGORY_CONTENT */
export const DEFAULT_SOFTWARE_PAGE_CONTENT = DEFAULT_SOFTWARE_CATEGORY_CONTENT;

export function getSoftwareCategoryPaths(): string[] {
  return SOFTWARE_CATEGORY_ORDER.map((key) =>
    SOFTWARE_CATEGORIES[key].path.replace(/^\//, ""),
  );
}

/** @deprecated Use getSoftwareCategoryPaths */
export const getSoftwarePagePaths = getSoftwareCategoryPaths;

export function getSoftwareCategoryKeyBySlug(slugPath: string): SoftwareCategoryKey | null {
  const normalized = slugPath.replace(/^\//, "");
  for (const key of SOFTWARE_CATEGORY_ORDER) {
    if (SOFTWARE_CATEGORIES[key].path.replace(/^\//, "") === normalized) {
      return key;
    }
  }
  return null;
}

/** @deprecated Use getSoftwareCategoryKeyBySlug */
export const getSoftwarePageKeyBySlug = getSoftwareCategoryKeyBySlug;

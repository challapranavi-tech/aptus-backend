import type { OracleInnerPageKey } from "@/lib/cms/oracle-inner-registry";
import { ORACLE_INNER_PAGE_DEFS } from "@/lib/cms/oracle-inner-registry";
import type { SoftwareInnerPageKey } from "@/lib/cms/software-inner-pages-content";
import { SITE } from "@/lib/constants";
import type {
  MarketingCardItemContent,
  MarketingPageContent,
  MarketingPageSections,
} from "@/types/marketing-page";

const MAILTO = `mailto:${SITE.email}`;

const ORACLE_WHY_CHOOSE = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Authorized Oracle Partner",
      body: "Genuine Oracle Primavera and Aconex licenses with official support channels and compliant procurement.",
    },
    {
      title: "Implementation Support",
      body: "Guidance on deployment, user setup, integrations, and alignment with your project controls workflows.",
    },
    {
      title: "Local Expertise in Oman",
      body: "Muscat-based team providing responsive sales, technical support, and training across the GCC.",
    },
    {
      title: "End-to-End Service",
      body: "From license procurement and renewal to rollout planning — a single trusted partner for Oracle project solutions.",
    },
  ],
};

type ProductPageInput = {
  label: string;
  metaDescription: string;
  subtitle: string;
  introTitle: { before: string; accent: string };
  introParagraphs: string[];
  features: MarketingCardItemContent[];
  lists?: { eyebrow?: string; title?: { before: string; accent: string }; items: string[] };
  extraSections?: MarketingPageContent["cardSections"];
};

function buildProductPage(input: ProductPageInput): MarketingPageContent {
  return {
    metaTitle: `${input.label} | Aptus Infotech`,
    metaDescription: input.metaDescription,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: input.label },
      subtitle: input.subtitle,
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: input.introTitle,
      paragraphs: input.introParagraphs,
    },
    lists: input.lists
      ? [
          {
            id: "capabilities",
            visible: true,
            eyebrow: input.lists.eyebrow,
            title: input.lists.title,
            items: input.lists.items,
          },
        ]
      : undefined,
    cardSections: [
      {
        id: "features",
        visible: true,
        eyebrow: "Capabilities",
        title: { before: "Key", accent: "Features" },
        align: "center",
        items: input.features,
      },
      ...(input.extraSections ?? []),
      ORACLE_WHY_CHOOSE,
    ],
    showContactCta: true,
  };
}

const ORACLE_INNER_CONTENT: Record<OracleInnerPageKey, MarketingPageContent> = {
  oraclePrimaveraP6: buildProductPage({
    label: "Oracle Primavera P6",
    metaDescription:
      "Oracle Primavera P6 Professional — project planning, scheduling, and portfolio management for construction and engineering teams in Oman.",
    subtitle: "Mastering complex projects with industry-leading scheduling and controls",
    introTitle: { before: "Mastering", accent: "Complex Projects" },
    introParagraphs: [
      "Oracle Primavera P6 Professional Project Management is the industry's leading solution for prioritizing, planning, managing, and executing projects, programs, and portfolios. Widely adopted across construction, engineering, aerospace, utilities, oil & gas, and manufacturing, Primavera P6 helps teams deliver on time and within budget.",
      "Aptus Infotech supplies genuine Primavera P6 licenses with local implementation support, training coordination, and license administration for project-driven organizations in Oman.",
    ],
    lists: {
      eyebrow: "Capabilities",
      title: { before: "What Primavera P6", accent: "Delivers" },
      items: [
        "Develop detailed project schedules with activities, dependencies, constraints, and critical path analysis.",
        "Optimize resource management across personnel, equipment, and materials on single or multiple projects.",
        "Track costs against budgets with earned value, forecasting, and financial discipline.",
        "Manage programs and portfolios with consolidated views of performance and health.",
        "Identify and mitigate risks with structured planning and impact assessment.",
        "Monitor progress against baselines and generate Gantt, resource, and earned value reports.",
        "Share schedule data across teams for alignment on goals and milestones.",
        "Scale from small initiatives to mega-projects with thousands of activities.",
      ],
    },
    features: [
      { title: "Project Management", body: "Plan, execute, and control projects with enterprise-grade scheduling tools." },
      { title: "Project Scheduling", body: "Build CPM schedules with dependencies, constraints, and what-if scenarios." },
      { title: "Resource Management", body: "Level workloads and resolve bottlenecks across shared resource pools." },
      { title: "Critical Path Method", body: "Identify driving activities and manage float to protect delivery dates." },
      { title: "Risk Analysis", body: "Incorporate risk registers and mitigation plans into the project baseline." },
    ],
  }),
  aconex: {
    metaTitle: "Oracle Aconex | Aptus Infotech",
    metaDescription:
      "Oracle Aconex — cloud construction project management for document control, collaboration, and workflow coordination in Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: "Oracle Aconex" },
      subtitle: "The world's leading construction project management platform",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Transform", accent: "Construction Project Management" },
      paragraphs: [
        "Oracle Aconex is a powerful cloud-based construction project management platform that streamlines communication, documentation, and workflow coordination across the entire project lifecycle. It centralizes project data in a secure common data environment (CDE) for construction, engineering, and infrastructure teams.",
        "With document control, quality tracking, risk management, and digital collaboration, Aconex supports smoother delivery, reduces delays, improves compliance, and helps projects finish safely, on time, and within budget.",
      ],
    },
    cardSections: [
      {
        id: "key-features",
        visible: true,
        eyebrow: "Features",
        title: { before: "Key Features of", accent: "Oracle Aconex" },
        align: "center",
        items: [
          {
            title: "Document Control & Collaboration",
            body: "Centralized document management with version control, markup tools, and real-time collaboration.",
          },
          {
            title: "Risk Management & Safety",
            body: "Risk registers, hazard identification, inspections, and safety management for compliance.",
          },
          {
            title: "Quality Assurance & Punch Lists",
            body: "Defect tracking, NCRs, and punch list workflows with automated resolution tracking.",
          },
          {
            title: "Scheduling & Progress Tracking",
            body: "Gantt visualization, progress monitoring, and schedule analysis with real-time alerts.",
          },
          {
            title: "Communication Hub",
            body: "Integrated messaging, meeting minutes, and action item tracking for all stakeholders.",
          },
          {
            title: "Mobile Accessibility",
            body: "Native iOS and Android apps with offline capability for field teams.",
          },
        ],
      },
      {
        id: "benefits",
        visible: true,
        eyebrow: "Benefits",
        title: { before: "Benefits for", accent: "Construction Teams" },
        align: "center",
        items: [
          {
            title: "Reduced Project Delays",
            body: "Improve communication and streamline workflows to minimize costly disruptions.",
          },
          {
            title: "Cost Savings",
            body: "Minimize rework, optimize resources, and maintain budget control across the lifecycle.",
          },
          {
            title: "Enhanced Safety",
            body: "Digital safety plans, hazard reporting, and compliance tracking on site.",
          },
          {
            title: "Stakeholder Alignment",
            body: "Connect owners, contractors, designers, and suppliers with real-time project data.",
          },
        ],
      },
      {
        id: "why-aptus-aconex",
        visible: true,
        eyebrow: "Why Aptus",
        title: { before: "Why Oracle Aconex Through", accent: "Aptus Infotech" },
        align: "center",
        items: [
          {
            title: "Certified Specialists",
            body: "Oracle Aconex experts with extensive construction technology deployment experience.",
          },
          {
            title: "Customized Workflows",
            body: "Platform configuration aligned to your processes — not generic templates.",
          },
          {
            title: "Dedicated Support",
            body: "Responsive technical assistance and maintenance during critical project phases.",
          },
          {
            title: "Future-Ready Technology",
            body: "Solutions that scale with your portfolio and adapt to emerging construction tech.",
          },
        ],
      },
      ORACLE_WHY_CHOOSE,
    ],
    showContactCta: true,
  },
};

export function getOracleInnerContent(key: SoftwareInnerPageKey): MarketingPageContent | null {
  if (!(key in ORACLE_INNER_CONTENT)) return null;
  return ORACLE_INNER_CONTENT[key as OracleInnerPageKey];
}

/** JSON sections only — paste into Odoo `x_page_sections_json`. */
export function toOracleOdooSections(content: MarketingPageContent): MarketingPageSections {
  const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}

export const ORACLE_SUBNAV_LINKS = ORACLE_INNER_PAGE_DEFS.map((def) => ({
  label: def.label,
  href: def.path,
}));

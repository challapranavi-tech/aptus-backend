import type { MicrosoftInnerPageKey } from "@/lib/cms/microsoft-inner-registry";
import { MICROSOFT_INNER_PAGE_DEFS } from "@/lib/cms/microsoft-inner-registry";
import type { SoftwareInnerPageKey } from "@/lib/cms/software-inner-pages-content";
import { SITE } from "@/lib/constants";
import type {
  MarketingCardItemContent,
  MarketingPageContent,
  MarketingPageSections,
} from "@/types/marketing-page";

const MAILTO = `mailto:${SITE.email}`;

const MICROSOFT_WHY_CHOOSE = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Authorized Microsoft Partner",
      body: "Genuine Microsoft 365, Visio, and Power BI licenses with official support channels and compliant procurement.",
    },
    {
      title: "Implementation Support",
      body: "Guidance on tenant setup, plan selection, Teams deployment, and integration with your existing IT environment.",
    },
    {
      title: "Local Expertise in Oman",
      body: "Muscat-based team providing responsive sales, technical support, and training across the GCC.",
    },
    {
      title: "End-to-End Service",
      body: "From license procurement and renewal to rollout planning — a single trusted partner for Microsoft solutions.",
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
      MICROSOFT_WHY_CHOOSE,
    ],
    showContactCta: true,
  };
}

const MICROSOFT_INNER_CONTENT: Record<MicrosoftInnerPageKey, MarketingPageContent> = {
  microsoft365Apps: buildProductPage({
    label: "Microsoft 365 Apps",
    metaDescription:
      "Microsoft 365 Apps — cloud-connected productivity suite with Word, Excel, PowerPoint, Outlook, and OneDrive for teams in Oman.",
    subtitle: "The core productivity suite for modern workplaces",
    introTitle: { before: "Work Smarter with", accent: "Microsoft 365 Apps" },
    introParagraphs: [
      "Microsoft 365 Apps (formerly Office 365 ProPlus) is the cloud-connected version of Microsoft's essential productivity applications. Delivered as a subscription, it provides familiar tools enhanced with cloud collaboration, security, and access across devices.",
      "Aptus Infotech supplies genuine Microsoft 365 Apps licenses with deployment guidance and local support for organizations across Oman.",
    ],
    lists: {
      eyebrow: "Capabilities",
      title: { before: "What Microsoft 365 Apps", accent: "Delivers" },
      items: [
        "Access the latest Word, Excel, PowerPoint, Outlook, and OneNote with industry-standard productivity tools.",
        "Save and sync files with OneDrive across PCs, Macs, tablets, and smartphones.",
        "Co-author documents in real time and reduce version control issues across teams.",
        "Integrate with Microsoft Teams for chat, meetings, and file sharing.",
        "Benefit from built-in security, compliance controls, and access management.",
        "Receive continuous updates, security patches, and new features without buying new releases.",
        "Install on multiple devices per user for flexible work from office, home, or on the go.",
      ],
    },
    features: [
      { title: "Productivity Software", body: "Word, Excel, PowerPoint, and Outlook for daily business tasks." },
      { title: "Cloud Collaboration", body: "OneDrive sync and real-time co-authoring across your organization." },
      { title: "Business Email & Calendar", body: "Professional communication with Outlook and shared calendars." },
      { title: "Data Security", body: "Built-in protection and policy controls for sensitive information." },
      { title: "Real-Time Co-authoring", body: "Multiple users edit the same document simultaneously." },
    ],
  }),
  microsoft365Business: buildProductPage({
    label: "Microsoft 365 Business",
    metaDescription:
      "Microsoft 365 Business — integrated productivity, Teams, Exchange, and security for SMBs in Oman.",
    subtitle: "Comprehensive productivity, collaboration, and security for SMBs",
    introTitle: { before: "Built for", accent: "Growing Businesses" },
    introParagraphs: [
      "Microsoft 365 Business combines productivity apps with intelligent cloud services, security features, and simplified device management — tailored for small and medium-sized businesses.",
      "Aptus Infotech helps SMBs choose the right Business plan (Basic, Standard, or Premium) and roll out Teams, email, and security with local expertise in Oman.",
    ],
    lists: {
      eyebrow: "Capabilities",
      title: { before: "What Microsoft 365 Business", accent: "Delivers" },
      items: [
        "Provide Word, Excel, PowerPoint, and Outlook with the latest app versions on multiple devices.",
        "Deliver business-class email and calendaring with Exchange Online and OneDrive for Business.",
        "Enable teamwork with Microsoft Teams, SharePoint, and real-time co-authoring.",
        "Protect against phishing and malware with advanced security features by plan.",
        "Manage devices and apps with MDM capabilities (especially on Business Premium).",
        "Support secure remote work and business continuity from any location.",
        "Simplify IT with cloud deployment, updates, and maintenance.",
      ],
    },
    features: [
      { title: "SMB Solutions", body: "Plans sized for small and medium businesses with predictable licensing." },
      { title: "Business-Class Email", body: "Exchange Online with professional email and calendaring." },
      { title: "Cloud Collaboration", body: "Teams, SharePoint, and shared workspaces for distributed teams." },
      { title: "Data & Device Security", body: "Identity protection, threat defense, and optional DLP controls." },
      { title: "Productivity Suite", body: "Full Microsoft 365 Apps included across Business plans." },
    ],
  }),
  powerBi: buildProductPage({
    label: "Power BI",
    metaDescription:
      "Microsoft Power BI — business intelligence, dashboards, and data visualization for teams in Oman.",
    subtitle: "Transform data into actionable insights",
    introTitle: { before: "Unlock Insights with", accent: "Power BI" },
    introParagraphs: [
      "Microsoft Power BI is an interactive business intelligence and data visualization platform that connects to diverse data sources, transforms raw data, and delivers compelling reports and dashboards for informed decision-making.",
      "License Power BI through Aptus Infotech with guidance on Pro vs. Premium, data governance, and rollout across your organization in Oman.",
    ],
    lists: {
      eyebrow: "Capabilities",
      title: { before: "What Power BI", accent: "Delivers" },
      items: [
        "Connect to hundreds of sources — cloud services, databases, Excel, and web data.",
        "Transform and model data with Power Query and DAX for robust analysis.",
        "Build interactive dashboards with charts, maps, and drill-down visualizations.",
        "Discover patterns with AI-powered Quick Insights and natural language Q&A.",
        "Share reports securely via the Power BI service with controlled access.",
        "Access dashboards on mobile apps for iOS, Android, and Windows.",
        "Integrate deeply with Excel, Azure, and Dynamics 365.",
      ],
    },
    features: [
      { title: "Data Connectivity", body: "Unify data from SQL, Salesforce, Excel, and cloud APIs." },
      { title: "Interactive Dashboards", body: "Self-service BI with filters, drill-downs, and live tiles." },
      { title: "AI-Powered Insights", body: "Automated pattern detection and natural language queries." },
      { title: "Secure Sharing", body: "Publish to workspaces with role-based access control." },
      { title: "Microsoft Ecosystem", body: "Works seamlessly with Microsoft 365 and Azure services." },
    ],
  }),
  microsoftVisio: {
    metaTitle: "Microsoft Visio | Aptus Infotech",
    metaDescription:
      "Microsoft Visio — professional diagramming for flowcharts, network diagrams, org charts, and floor plans in Oman.",
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: "Microsoft Visio" },
      subtitle: "Professional diagramming software that simplifies complexity",
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Diagrams Made", accent: "Simple" },
      paragraphs: [
        "Microsoft Visio helps you visualize complex information with professional diagrams — flowcharts, network diagrams, org charts, floor plans, and more.",
        "With intuitive tools, extensive shape libraries, and Microsoft 365 integration, Visio brings clarity to IT infrastructure, business processes, and facilities planning. Aptus Infotech supplies genuine Visio licenses with local support in Oman.",
      ],
    },
    cardSections: [
      {
        id: "key-features",
        visible: true,
        eyebrow: "Features",
        title: { before: "Powerful", accent: "Features" },
        align: "center",
        items: [
          {
            title: "Extensive Templates",
            body: "Built-in templates for flowcharts, network diagrams, floor plans, and more.",
          },
          {
            title: "Rich Shape Libraries",
            body: "Thousands of industry-standard shapes and stencils for professional diagrams.",
          },
          {
            title: "Data Linking",
            body: "Connect diagrams to live data sources and auto-update when data changes.",
          },
          {
            title: "Real-Time Collaboration",
            body: "Co-author diagrams, share feedback, and track changes with your team.",
          },
          {
            title: "Cloud Integration",
            body: "Save to OneDrive and access diagrams from anywhere.",
          },
          {
            title: "Developer Tools",
            body: "Extend Visio with add-ins and automation via the Visio SDK and APIs.",
          },
        ],
      },
      {
        id: "benefits",
        visible: true,
        eyebrow: "Benefits",
        title: { before: "Why Organizations Choose", accent: "Visio" },
        align: "center",
        items: [
          { title: "Easy to Learn", body: "Familiar Microsoft interface accessible to users of all skill levels." },
          { title: "Time-Saving", body: "Templates and automation create diagrams in minutes, not hours." },
          { title: "Enhanced Communication", body: "Visual representations improve understanding and decisions." },
          { title: "Enterprise Security", body: "Microsoft-grade security and compliance for sensitive diagrams." },
        ],
      },
      {
        id: "why-aptus-visio",
        visible: true,
        eyebrow: "Why Aptus",
        title: { before: "Why Visio Through", accent: "Aptus Infotech" },
        align: "center",
        items: [
          { title: "Official Partner", body: "Genuine Microsoft Visio and Microsoft 365 licensing." },
          { title: "Technical Support", body: "Installation, troubleshooting, and usage assistance." },
          { title: "Local Presence", body: "Personalized service and quick response times in Oman." },
          { title: "Expert Training", body: "Certified trainers for industry-specific Visio programs." },
        ],
      },
      MICROSOFT_WHY_CHOOSE,
    ],
    showContactCta: true,
  },
};

export function getMicrosoftInnerContent(key: SoftwareInnerPageKey): MarketingPageContent | null {
  if (!(key in MICROSOFT_INNER_CONTENT)) return null;
  return MICROSOFT_INNER_CONTENT[key as MicrosoftInnerPageKey];
}

/** JSON sections only — paste into Odoo `x_page_sections_json`. */
export function toMicrosoftOdooSections(content: MarketingPageContent): MarketingPageSections {
  const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}

export const MICROSOFT_SUBNAV_LINKS = MICROSOFT_INNER_PAGE_DEFS.map((def) => ({
  label: def.label,
  href: def.path,
}));

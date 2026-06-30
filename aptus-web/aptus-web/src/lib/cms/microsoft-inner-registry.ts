import type { SoftwareCategoryKey } from "@/lib/cms/software-pages-content";

/** Microsoft product pages under Software → Microsoft. */
export type MicrosoftInnerPageKey =
  | "microsoft365Apps"
  | "microsoft365Business"
  | "microsoftVisio"
  | "powerBi";

export type MicrosoftInnerPageDef = {
  key: MicrosoftInnerPageKey;
  category: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  description: string;
  intro: string;
};

export const MICROSOFT_INNER_PAGE_DEFS: MicrosoftInnerPageDef[] = [
  {
    key: "microsoft365Apps",
    category: "microsoft",
    path: "/microsoft-365-apps",
    odooUrl: "/microsoft-365-apps",
    odooPageId: 193,
    label: "Microsoft 365 Apps",
    description:
      "Microsoft 365 Apps — cloud-connected Word, Excel, PowerPoint, Outlook, and more for modern workplaces in Oman.",
    intro:
      "Aptus Infotech supplies genuine Microsoft 365 Apps subscriptions with deployment guidance, license administration, and local support for teams across Oman.",
  },
  {
    key: "microsoft365Business",
    category: "microsoft",
    path: "/microsoft-365-business",
    odooUrl: "/microsoft-365-business",
    odooPageId: 196,
    label: "Microsoft 365 Business",
    description:
      "Microsoft 365 Business — productivity, collaboration, and security suite tailored for small and medium businesses.",
    intro:
      "License Microsoft 365 Business through Aptus Infotech with expert advice on plans, Teams rollout, and device management for SMBs in Oman.",
  },
  {
    key: "microsoftVisio",
    category: "microsoft",
    path: "/microsoft-visio",
    odooUrl: "/microsoft-visio",
    odooPageId: 222,
    label: "Microsoft Visio",
    description:
      "Microsoft Visio — professional diagramming for flowcharts, network diagrams, org charts, and floor plans.",
    intro:
      "Get Microsoft Visio licensing and support from Aptus Infotech — authorized Microsoft partner in Oman — with training and deployment assistance.",
  },
  {
    key: "powerBi",
    category: "microsoft",
    path: "/power-bi",
    odooUrl: "/power-bi",
    odooPageId: 198,
    label: "Power BI",
    description:
      "Microsoft Power BI — business intelligence and interactive data visualization for informed decision-making.",
    intro:
      "Aptus Infotech helps organizations adopt Power BI with the right licensing, data connectivity guidance, and rollout support across teams in Oman.",
  },
];

export const MICROSOFT_INNER_PATHS = MICROSOFT_INNER_PAGE_DEFS.map((def) =>
  def.path.replace(/^\//, ""),
);

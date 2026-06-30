import type { SoftwareCategoryKey } from "@/lib/cms/software-pages-content";

/** Oracle product pages under Software → Oracle. */
export type OracleInnerPageKey = "oraclePrimaveraP6" | "aconex";

export type OracleInnerPageDef = {
  key: OracleInnerPageKey;
  category: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  description: string;
  intro: string;
};

export const ORACLE_INNER_PAGE_DEFS: OracleInnerPageDef[] = [
  {
    key: "oraclePrimaveraP6",
    category: "oracle",
    path: "/oracle-primavera-p6",
    odooUrl: "/oracle-primavera-p6",
    odooPageId: 176,
    label: "Oracle Primavera P6",
    description:
      "Oracle Primavera P6 Professional — industry-leading project planning, scheduling, and portfolio management for complex projects in Oman.",
    intro:
      "Aptus Infotech supplies genuine Oracle Primavera P6 licenses with deployment guidance, training coordination, and local support for construction, engineering, and infrastructure teams.",
  },
  {
    key: "aconex",
    category: "oracle",
    path: "/aconex",
    odooUrl: "/aconex",
    odooPageId: 221,
    label: "Oracle Aconex",
    description:
      "Oracle Aconex — cloud construction project management for document control, collaboration, and workflow coordination.",
    intro:
      "License and deploy Oracle Aconex through Aptus Infotech — your partner for construction collaboration platforms, CDE setup, and ongoing support in Oman.",
  },
];

export const ORACLE_INNER_PATHS = ORACLE_INNER_PAGE_DEFS.map((def) =>
  def.path.replace(/^\//, ""),
);

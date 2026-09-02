import type { SoftwareSubNavLink } from "@/data/software-subnav";

/**
 * All products from the three product detailing PDFs
 * (renewals · levels · single bundle).
 * Merged into /software-solutions and brand sidebars.
 */
export const PDF_AUTODESK_RENEWAL_PRODUCTS: SoftwareSubNavLink[] = [
  { label: "AutoCAD", href: "/autocad" },
  { label: "Civil 3D", href: "/civil-3d" },
  { label: "AEC Collection", href: "/aec-collection" },
  {
    label: "Product Design & Manufacturing Collection",
    href: "/product-design-manufacturing-collection",
  },
  { label: "AutoCAD LT", href: "/autocad-lt" },
  { label: "AutoCAD Revit LT Suite", href: "/autocad-revit-lt-suite" },
  { label: "Forma Design Collaboration", href: "/bim-collaborate-pro" },
  { label: "3ds Max", href: "/3ds-max" },
  { label: "Autodesk Build", href: "/autodesk-build" },
  { label: "Autodesk Takeoff", href: "/autodesk-takeoff" },
  { label: "Autodesk Docs", href: "/autodesk-docs" },
  { label: "BIM Collaborate", href: "/bim-collaborate" },
  { label: "Fabrication CAMduct", href: "/fabrication-camduct" },
  { label: "InfraWorks", href: "/infraworks" },
  { label: "Inventor Professional", href: "/inventor-professional" },
  { label: "Navisworks Manage", href: "/navisworks" },
  { label: "Navisworks Simulate", href: "/navisworks-simulate" },
  { label: "Revit", href: "/revit" },
];

export const PDF_WATER_INFRASTRUCTURE_PRODUCTS: SoftwareSubNavLink[] = [
  { label: "InfoDrainage", href: "/infodrainage" },
  { label: "InfoWater Pro", href: "/infowater-pro" },
  { label: "InfoWorks ICM Standard", href: "/infoworks-icm" },
  { label: "InfoWorks ICM Ultimate", href: "/infoworks-icm-ultimate" },
  { label: "InfoWorks WS Pro", href: "/infoworks-ws-pro" },
];

export const PDF_ADOBE_LEVEL_PRODUCTS: SoftwareSubNavLink[] = [
  {
    label: "Creative Cloud for Teams All Apps",
    href: "/adobe-business-creative-solutions",
  },
  { label: "Creative Cloud for Teams Education", href: "/creative-cloud-teams-education" },
  { label: "Creative Cloud for Enterprise HED", href: "/creative-cloud-enterprise-hed" },
  { label: "Creative Cloud for Enterprise", href: "/creative-cloud-enterprise" },
  { label: "Adobe Acrobat Pro", href: "/adobe-acrobat-pro" },
  { label: "Adobe Illustrator", href: "/adobe-illustrator" },
  { label: "Adobe Photoshop", href: "/adobe-photoshop" },
  { label: "Adobe Premiere Pro", href: "/adobe-premiere-pro" },
];

export const PDF_ORACLE_BUNDLE_PRODUCTS: SoftwareSubNavLink[] = [
  { label: "Primavera P6 Professional", href: "/oracle-primavera-p6" },
  { label: "Primavera P6 Enterprise", href: "/oracle-primavera-p6-enterprise" },
  { label: "Aconex", href: "/aconex" },
  {
    label: "Oracle Software Update License & Support",
    href: "/oracle-software-update-license-support",
  },
];

export const PDF_MICROSOFT_BUNDLE_PRODUCTS: SoftwareSubNavLink[] = [
  { label: "Microsoft 365 E3", href: "/microsoft-365-e3" },
  { label: "Microsoft 365 Apps", href: "/microsoft-365-apps" },
  { label: "Microsoft 365 Business Standard", href: "/microsoft-365-business" },
  { label: "Microsoft 365 Business Basic", href: "/microsoft-365-business-basic" },
  { label: "Exchange Online Kiosk", href: "/exchange-online-kiosk" },
  { label: "Microsoft Teams Essentials", href: "/microsoft-teams-essentials" },
  { label: "Microsoft Visio Plan 2", href: "/microsoft-visio" },
  { label: "Copilot for Microsoft 365", href: "/copilot-for-microsoft-365" },
  { label: "Planner Plan 1", href: "/planner-plan-1" },
  { label: "Planner and Project Plan 3", href: "/planner-and-project-plan-3" },
  { label: "Power BI Pro", href: "/power-bi" },
  { label: "Power BI Premium Per User", href: "/power-bi-premium-per-user" },
  { label: "Office 365 E1", href: "/office-365-e1" },
  {
    label: "Microsoft Defender for Office 365 Plan 1",
    href: "/microsoft-defender-office-365-plan-1",
  },
  { label: "Microsoft Teams Rooms Pro", href: "/microsoft-teams-rooms-pro" },
  { label: "Office LTSC Standard 2024", href: "/office-ltsc-standard-2024" },
  { label: "Windows 11 Pro", href: "/windows-11-pro" },
  { label: "Project Professional 2024", href: "/project-professional-2024" },
  { label: "Windows Server 2025 Standard", href: "/windows-server-2025" },
];

/** Dedupe links by href while preserving first label. */
export function mergeSoftwareLinks(...groups: SoftwareSubNavLink[][]): SoftwareSubNavLink[] {
  const seen = new Set<string>();
  const out: SoftwareSubNavLink[] = [];
  for (const group of groups) {
    for (const link of group) {
      const key = link.href.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(link);
    }
  }
  return out;
}

export const PDF_CATALOG_TITLES_BY_SLUG: Record<string, string> = {
  autocad: "AutoCAD — including specialized toolsets AD Commercial",
  "civil-3d": "Autodesk Civil 3D Commercial Subscription",
  "aec-collection": "Architecture Engineering & Construction Collection IC Commercial",
  "product-design-manufacturing-collection":
    "Autodesk Product Design & Manufacturing Collection IC Commercial",
  "autocad-lt": "AutoCAD LT Commercial",
  "autocad-revit-lt-suite": "AutoCAD Revit LT Suite Commercial",
  "bim-collaborate-pro": "Autodesk Forma Design Collaboration (formerly BIM Collaborate Pro)",
  "3ds-max": "3ds Max Commercial",
  "autodesk-build": "Build — CLOUD Commercial",
  "autodesk-takeoff": "Takeoff CLOUD Commercial",
  "autodesk-docs": "Docs — User CLOUD Commercial",
  "bim-collaborate": "BIM Collaborate CLOUD Commercial",
  "fabrication-camduct": "Fabrication CAMduct Commercial",
  infraworks: "InfraWorks Commercial",
  "inventor-professional": "Inventor Professional Commercial",
  navisworks: "Navisworks Manage Commercial",
  "navisworks-simulate": "Navisworks Simulate Commercial",
  revit: "Revit Commercial",
  infodrainage: "InfoDrainage Commercial",
  "infowater-pro": "InfoWater Pro Commercial",
  "infoworks-icm": "InfoWorks ICM — Standard Commercial",
  "infoworks-icm-ultimate": "InfoWorks ICM — Ultimate Commercial",
  "infoworks-ws-pro": "InfoWorks WS Pro Commercial",
  "adobe-business-creative-solutions":
    "Creative Cloud for teams All Apps — Multi-platform · Multi European Languages",
  "creative-cloud-teams-education":
    "Creative Cloud for teams All Apps — Education Subscription",
  "creative-cloud-enterprise-hed":
    "Creative Cloud for enterprise All Apps — New HED Subscription",
  "creative-cloud-enterprise":
    "Creative Cloud for enterprise All Apps — Multi-platform · Multi European Languages",
  "adobe-acrobat-pro":
    "Acrobat Pro for teams — Multi-platform · Multi European Languages Subscription",
  "adobe-illustrator":
    "Illustrator for teams — Multi-platform · Multi European Languages Subscription",
  "adobe-photoshop":
    "Photoshop for enterprise — Multi-platform · Multi European Languages Subscription",
  "adobe-premiere-pro":
    "Premiere Pro for teams — Multi-platform · Multi European Languages Subscription",
  "oracle-primavera-p6":
    "Primavera P6 Professional Project Management — Application User Perpetual",
  "oracle-primavera-p6-enterprise":
    "Primavera P6 Enterprise Project Portfolio Management — Application User Perpetual",
  "oracle-software-update-license-support": "Software Update License & Support",
  "microsoft-365-e3": "Microsoft 365 E3",
  "microsoft-365-apps": "Microsoft 365 Apps for business",
  "microsoft-365-business": "Microsoft 365 Business Standard",
  "microsoft-365-business-basic": "Microsoft 365 Business Basic",
  "exchange-online-kiosk": "Exchange Online Kiosk",
  "microsoft-teams-essentials": "Microsoft Teams Essentials",
  "microsoft-visio": "Visio Plan 2",
  "copilot-for-microsoft-365": "Copilot for Microsoft 365",
  "planner-plan-1": "Planner Plan 1",
  "planner-and-project-plan-3": "Planner and Project Plan 3",
  "power-bi": "Power BI Pro",
  "power-bi-premium-per-user": "Power BI Premium Per User",
  "office-365-e1": "Office 365 E1 (no Teams)",
  "microsoft-defender-office-365-plan-1": "Microsoft Defender for Office 365 (Plan 1)",
  "microsoft-teams-rooms-pro": "Microsoft Teams Rooms Pro without Audio Conferencing",
  "office-ltsc-standard-2024": "Office LTSC Standard 2024 Commercial Perpetual",
  "windows-11-pro": "Windows 11 Pro — Perpetual Commercial",
  "project-professional-2024": "Project Professional 2024 — Commercial Perpetual",
  "windows-server-2025": "Windows Server 2025 Standard — 16 Core License Pack",
};

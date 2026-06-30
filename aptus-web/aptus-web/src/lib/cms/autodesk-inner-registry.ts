import type { SoftwareCategoryKey } from "@/lib/cms/software-pages-content";

/** Autodesk product pages — paths match site nav under Software → Autodesk. */
export type AutodeskInnerPageKey =
  | "autocad"
  | "threeDsMax"
  | "revit"
  | "civil3d"
  | "aecCollection"
  | "autocadLt"
  | "bimCollaboratePro"
  | "autodeskDocs"
  | "autodeskBuild"
  | "autodeskTakeoff"
  | "navisworks"
  | "infodrainage"
  | "infowaterPro"
  | "infoworksIcm"
  | "infoworksWsPro";

export type AutodeskInnerPageDef = {
  key: AutodeskInnerPageKey;
  category: SoftwareCategoryKey;
  path: string;
  odooUrl: string;
  odooPageId: number;
  label: string;
  description: string;
  intro: string;
};

export const AUTODESK_INNER_PAGE_DEFS: AutodeskInnerPageDef[] = [
  {
    key: "autocad",
    category: "autodesk",
    path: "/autocad",
    odooUrl: "/autocad",
    odooPageId: 0,
    label: "AutoCAD",
    description:
      "AutoCAD — industry-leading 2D and 3D CAD software for drafting, design, and documentation in Oman.",
    intro:
      "Aptus Infotech supplies genuine AutoCAD licenses with deployment guidance and local support. AutoCAD is the foundation for precision drafting across architecture, engineering, and construction teams.",
  },
  {
    key: "threeDsMax",
    category: "autodesk",
    path: "/3ds-max",
    odooUrl: "/3ds-max",
    odooPageId: 0,
    label: "3ds Max",
    description:
      "3ds Max — professional 3D modeling, animation, and rendering for games, film, and visualization.",
    intro:
      "License 3ds Max through Aptus Infotech with expert advice on suitable collections and render pipelines for your studio or project team in Oman.",
  },
  {
    key: "revit",
    category: "autodesk",
    path: "/revit",
    odooUrl: "/revit",
    odooPageId: 0,
    label: "Revit",
    description:
      "Autodesk Revit — BIM software for architectural design, MEP engineering, and structural modeling.",
    intro:
      "Aptus Infotech helps AEC firms adopt Revit for coordinated BIM workflows — from licensing and standards setup to implementation support.",
  },
  {
    key: "civil3d",
    category: "autodesk",
    path: "/civil-3d",
    odooUrl: "/civil-3d",
    odooPageId: 0,
    label: "Civil 3D",
    description:
      "Civil 3D — civil engineering design and documentation for surveying, corridors, and infrastructure projects.",
    intro:
      "Get Civil 3D licensing and support from Aptus Infotech for transportation, land development, and water infrastructure projects across the GCC.",
  },
  {
    key: "aecCollection",
    category: "autodesk",
    path: "/aec-collection",
    odooUrl: "/aec-collection",
    odooPageId: 0,
    label: "AEC Collection",
    description:
      "Autodesk AEC Collection — essential BIM and CAD tools including Revit, Civil 3D, InfraWorks, and Navisworks.",
    intro:
      "The AEC Collection bundles the tools architecture, engineering, and construction teams need. Aptus Infotech advises on the right collection plan and rollout for your organization.",
  },
  {
    key: "autocadLt",
    category: "autodesk",
    path: "/autocad-lt",
    odooUrl: "/autocad-lt",
    odooPageId: 0,
    label: "AutoCAD LT",
    description:
      "AutoCAD LT — cost-effective 2D drafting and documentation for professionals who do not need full AutoCAD.",
    intro:
      "Aptus Infotech provides AutoCAD LT licenses for teams focused on 2D drafting, with genuine software and local technical support in Oman.",
  },
  {
    key: "bimCollaboratePro",
    category: "autodesk",
    path: "/bim-collaborate-pro",
    odooUrl: "/bim-collaborate-pro",
    odooPageId: 0,
    label: "BIM Collaborate Pro",
    description:
      "BIM Collaborate Pro — cloud collaboration for design review, issue tracking, and model coordination.",
    intro:
      "Coordinate models and resolve clashes faster with BIM Collaborate Pro. Aptus Infotech supports licensing and integration with your Autodesk Construction Cloud workflow.",
  },
  {
    key: "autodeskDocs",
    category: "autodesk",
    path: "/autodesk-docs",
    odooUrl: "/autodesk-docs",
    odooPageId: 0,
    label: "Autodesk Docs",
    description:
      "Autodesk Docs — common data environment for document management and controlled distribution on construction projects.",
    intro:
      "Centralize drawings and project files with Autodesk Docs. Aptus Infotech helps teams deploy Docs as part of a broader ACC or BIM strategy.",
  },
  {
    key: "autodeskBuild",
    category: "autodesk",
    path: "/autodesk-build",
    odooUrl: "/autodesk-build",
    odooPageId: 0,
    label: "Autodesk Build",
    description:
      "Autodesk Build — field management for quality, safety, RFIs, and daily progress on site.",
    intro:
      "Connect office and site teams with Autodesk Build. Aptus Infotech provides licensing and guidance for contractors adopting ACC field tools.",
  },
  {
    key: "autodeskTakeoff",
    category: "autodesk",
    path: "/autodesk-takeoff",
    odooUrl: "/autodesk-takeoff",
    odooPageId: 0,
    label: "Autodesk Takeoff",
    description:
      "Autodesk Takeoff — 2D and 3D quantity takeoff and estimating integrated with Autodesk Construction Cloud.",
    intro:
      "Improve estimating accuracy with Autodesk Takeoff. Aptus Infotech supports quantity surveying and preconstruction teams with licensing and rollout.",
  },
  {
    key: "navisworks",
    category: "autodesk",
    path: "/navisworks",
    odooUrl: "/navisworks",
    odooPageId: 0,
    label: "Navisworks",
    description:
      "Navisworks — project review software for 3D coordination, clash detection, and simulation.",
    intro:
      "Use Navisworks to aggregate models and detect clashes before construction. Aptus Infotech supplies licenses and advises on BIM coordination workflows.",
  },
  {
    key: "infodrainage",
    category: "autodesk",
    path: "/infodrainage",
    odooUrl: "/infodrainage",
    odooPageId: 0,
    label: "InfoDrainage",
    description:
      "InfoDrainage — drainage design and analysis for sustainable stormwater and foul water systems.",
    intro:
      "InfoDrainage helps civil and water engineers design compliant drainage networks. Aptus Infotech provides licensing as part of Autodesk water infrastructure solutions.",
  },
  {
    key: "infowaterPro",
    category: "autodesk",
    path: "/infowater-pro",
    odooUrl: "/infowater-pro",
    odooPageId: 0,
    label: "InfoWater Pro",
    description:
      "InfoWater Pro — advanced water distribution modeling and analysis for utilities and consultants.",
    intro:
      "Model and optimize water distribution systems with InfoWater Pro. Aptus Infotech supports utilities and engineering firms with genuine licenses and local expertise.",
  },
  {
    key: "infoworksIcm",
    category: "autodesk",
    path: "/infoworks-icm",
    odooUrl: "/infoworks-icm",
    odooPageId: 0,
    label: "InfoWorks ICM",
    description:
      "InfoWorks ICM — integrated catchment modeling for urban drainage and wastewater networks.",
    intro:
      "InfoWorks ICM delivers integrated hydrology and hydraulics for complex drainage schemes. Contact Aptus Infotech for licensing and implementation guidance.",
  },
  {
    key: "infoworksWsPro",
    category: "autodesk",
    path: "/infoworks-ws-pro",
    odooUrl: "/infoworks-ws-pro",
    odooPageId: 0,
    label: "InfoWorks WS Pro",
    description:
      "InfoWorks WS Pro — water supply network modeling, analysis, and optimization for distribution systems.",
    intro:
      "Plan and operate water supply networks with InfoWorks WS Pro. Aptus Infotech is your authorized partner for Autodesk water infrastructure software in Oman.",
  },
];

export const AUTODESK_INNER_PATHS = AUTODESK_INNER_PAGE_DEFS.map((def) =>
  def.path.replace(/^\//, ""),
);

import type { AutodeskInnerPageKey } from "@/lib/cms/autodesk-inner-registry";
import { AUTODESK_INNER_PAGE_DEFS } from "@/lib/cms/autodesk-inner-registry";
import type { SoftwareInnerPageKey } from "@/lib/cms/software-inner-pages-content";
import { SITE } from "@/lib/constants";
import type {
  MarketingCardItemContent,
  MarketingPageContent,
  MarketingPageSections,
} from "@/types/marketing-page";

const MAILTO = `mailto:${SITE.email}`;

const AUTODESK_WHY_CHOOSE = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Authorized Autodesk Partner",
      body: "Genuine licenses, official support channels, and access to current Autodesk product versions.",
    },
    {
      title: "Implementation Support",
      body: "Guidance on deployment, collections, and integration with your existing IT and project workflows.",
    },
    {
      title: "Local Expertise",
      body: "Muscat-based team providing responsive sales, technical support, and training across Oman.",
    },
    {
      title: "End-to-End Service",
      body: "From license procurement and renewal to rollout planning — a single trusted partner for Autodesk.",
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
    cardSections: [
      {
        id: "features",
        visible: true,
        eyebrow: "Capabilities",
        title: { before: "Key", accent: "Features" },
        align: "center",
        items: input.features,
      },
      AUTODESK_WHY_CHOOSE,
    ],
    showContactCta: true,
  };
}

const AUTODESK_INNER_CONTENT: Record<AutodeskInnerPageKey, MarketingPageContent> = {
  autocad: buildProductPage({
    label: "AutoCAD",
    metaDescription:
      "AutoCAD — industry-leading 2D and 3D CAD software for drafting, design, and documentation in Oman.",
    subtitle: "Precision drafting and design for architecture, engineering, and construction",
    introTitle: { before: "Design with", accent: "Confidence" },
    introParagraphs: [
      "AutoCAD is the world's leading CAD platform for creating precise 2D drawings and 3D models. Teams use it for floor plans, schematics, mechanical parts, and construction documentation.",
      "Aptus Infotech supplies genuine AutoCAD and collection licenses with local support for installation, standards, and license management.",
    ],
    features: [
      { title: "2D Drafting", body: "Precision drawing tools, dimensions, and annotation for production documentation." },
      { title: "3D Modeling", body: "Create and edit 3D solids, surfaces, and meshes for design visualization." },
      { title: "Industry Toolsets", body: "Specialized toolsets for architecture, mechanical, electrical, and more." },
      { title: "Collaboration", body: "Share drawings via cloud and integrate with Autodesk construction tools." },
    ],
  }),
  threeDsMax: buildProductPage({
    label: "3ds Max",
    metaDescription:
      "3ds Max — professional 3D modeling, animation, and rendering for games, film, and visualization.",
    subtitle: "3D modeling, animation, and rendering for visualization and entertainment",
    introTitle: { before: "Bring Ideas to", accent: "Life in 3D" },
    introParagraphs: [
      "3ds Max delivers powerful modeling, animation, and rendering for architects, designers, and media professionals creating compelling visual experiences.",
      "License 3ds Max through Aptus Infotech with guidance on hardware, render engines, and collection options.",
    ],
    features: [
      { title: "Polygon Modeling", body: "Flexible modeling for assets, environments, and detailed geometry." },
      { title: "Animation & Rigging", body: "Character animation, constraints, and procedural animation tools." },
      { title: "Rendering", body: "Arnold and other render integrations for photorealistic output." },
      { title: "Visualization", body: "Ideal for architectural visualization and marketing renders." },
    ],
  }),
  revit: buildProductPage({
    label: "Revit",
    metaDescription:
      "Autodesk Revit — BIM software for architectural design, MEP engineering, and structural modeling.",
    subtitle: "BIM platform for coordinated architectural, structural, and MEP design",
    introTitle: { before: "Build with", accent: "BIM" },
    introParagraphs: [
      "Revit supports multidisciplinary BIM workflows so teams design, document, and coordinate in a single model environment.",
      "Aptus Infotech helps firms adopt Revit with the right licenses, templates, and rollout planning.",
    ],
    features: [
      { title: "Parametric Modeling", body: "Change any element and Revit updates related views and schedules." },
      { title: "Discipline Tools", body: "Architecture, structure, and MEP in coordinated project models." },
      { title: "Documentation", body: "Sheets, schedules, and construction documentation from the model." },
      { title: "Interoperability", body: "Exchange with Navisworks, ACC, and other Autodesk platforms." },
    ],
  }),
  civil3d: buildProductPage({
    label: "Civil 3D",
    metaDescription:
      "Civil 3D — civil engineering design and documentation for surveying, corridors, and infrastructure.",
    subtitle: "Civil engineering design for transportation, land, and water projects",
    introTitle: { before: "Engineer", accent: "Infrastructure" },
    introParagraphs: [
      "Civil 3D connects design and documentation for civil infrastructure with dynamic model-based corridors, surfaces, and pipe networks.",
      "Aptus Infotech supports civil consultants and contractors with licensing and implementation for projects in Oman.",
    ],
    features: [
      { title: "Corridor Modeling", body: "Road and rail corridor design with dynamic alignments and assemblies." },
      { title: "Survey & Surfaces", body: "Import survey data and build existing ground and design surfaces." },
      { title: "Pipe Networks", body: "Gravity and pressure pipe design with parts catalogs and analysis." },
      { title: "Production Drafting", body: "Plan and profile sheets generated from the civil model." },
    ],
  }),
  aecCollection: buildProductPage({
    label: "AEC Collection",
    metaDescription:
      "Autodesk AEC Collection — essential BIM and CAD tools including Revit, Civil 3D, InfraWorks, and Navisworks.",
    subtitle: "The essential BIM and CAD toolkit for architecture, engineering, and construction",
    introTitle: { before: "One Collection,", accent: "Complete AEC Workflow" },
    introParagraphs: [
      "The AEC Collection includes Revit, AutoCAD, Civil 3D, InfraWorks, Navisworks Manage, and more — optimized for building and infrastructure teams.",
      "Aptus Infotech advises on collection vs. single-product licensing and helps align purchases with your team structure.",
    ],
    features: [
      { title: "BIM & CAD Together", body: "Access Revit, AutoCAD, and Civil 3D under one subscription." },
      { title: "Coordination", body: "Navisworks for clash detection and model aggregation." },
      { title: "Conceptual Design", body: "InfraWorks for early-stage planning and visualization." },
      { title: "Value for Teams", body: "Cost-effective access when multiple disciplines need Autodesk tools." },
    ],
  }),
  autocadLt: buildProductPage({
    label: "AutoCAD LT",
    metaDescription:
      "AutoCAD LT — cost-effective 2D drafting and documentation for professionals who do not need full AutoCAD.",
    subtitle: "Reliable 2D drafting and documentation at a lower cost",
    introTitle: { before: "Efficient", accent: "2D Drafting" },
    introParagraphs: [
      "AutoCAD LT provides core 2D drafting capabilities for professionals who do not require full AutoCAD toolsets or 3D modeling.",
      "Aptus Infotech supplies AutoCAD LT for individuals and teams with genuine licensing and renewal support.",
    ],
    features: [
      { title: "2D Drafting", body: "Drawing, editing, and annotation tools for DWG-based workflows." },
      { title: "DWG Compatibility", body: "Work with standard DWG files used across the industry." },
      { title: "Web & Mobile", body: "View and edit drawings through AutoCAD web and mobile apps." },
      { title: "Affordable Access", body: "Lower-cost option for documentation-focused roles." },
    ],
  }),
  bimCollaboratePro: buildProductPage({
    label: "BIM Collaborate Pro",
    metaDescription:
      "BIM Collaborate Pro — cloud collaboration for design review, issue tracking, and model coordination.",
    subtitle: "Cloud-based design review and model coordination",
    introTitle: { before: "Coordinate Models in the", accent: "Cloud" },
    introParagraphs: [
      "BIM Collaborate Pro enables teams to review models, track issues, and coordinate designs without exchanging heavy files manually.",
      "Aptus Infotech supports ACC subscriptions including BIM Collaborate Pro for design and contractor teams.",
    ],
    features: [
      { title: "Design Review", body: "Review 2D and 3D files in the browser with markup tools." },
      { title: "Issue Tracking", body: "Assign, track, and resolve clashes and design issues centrally." },
      { title: "Version Control", body: "Work from current models with clear version history." },
      { title: "ACC Integration", body: "Part of Autodesk Construction Cloud for end-to-end project delivery." },
    ],
  }),
  autodeskDocs: buildProductPage({
    label: "Autodesk Docs",
    metaDescription:
      "Autodesk Docs — common data environment for document management and controlled distribution on construction projects.",
    subtitle: "Controlled document management for construction projects",
    introTitle: { before: "Single Source of", accent: "Truth" },
    introParagraphs: [
      "Autodesk Docs provides a common data environment for storing, reviewing, and distributing project documents across stakeholders.",
      "Deploy Docs with support from Aptus Infotech as part of your digital project delivery strategy.",
    ],
    features: [
      { title: "Document Control", body: "Manage revisions and approvals for drawings and specifications." },
      { title: "Access Permissions", body: "Role-based access for clients, consultants, and contractors." },
      { title: "ACC Platform", body: "Foundation for Build, Takeoff, and BIM Collaborate workflows." },
      { title: "Audit Trail", body: "Track who viewed and approved each document version." },
    ],
  }),
  autodeskBuild: buildProductPage({
    label: "Autodesk Build",
    metaDescription:
      "Autodesk Build — field management for quality, safety, RFIs, and daily progress on site.",
    subtitle: "Field management for quality, safety, and daily site operations",
    introTitle: { before: "Connect Site and", accent: "Office" },
    introParagraphs: [
      "Autodesk Build helps field teams capture issues, inspections, photos, and RFIs on mobile devices synced with the project record.",
      "Aptus Infotech licenses Build for contractors adopting Autodesk Construction Cloud in Oman.",
    ],
    features: [
      { title: "Quality & Safety", body: "Checklists, inspections, and issue capture in the field." },
      { title: "RFIs & Submittals", body: "Streamline communication between site and design teams." },
      { title: "Photo Documentation", body: "Attach geotagged photos to locations and activities." },
      { title: "Dashboards", body: "Monitor progress and open items across projects." },
    ],
  }),
  autodeskTakeoff: buildProductPage({
    label: "Autodesk Takeoff",
    metaDescription:
      "Autodesk Takeoff — 2D and 3D quantity takeoff and estimating integrated with Autodesk Construction Cloud.",
    subtitle: "2D and 3D quantity takeoff for faster, accurate estimating",
    introTitle: { before: "Estimate with", accent: "Confidence" },
    introParagraphs: [
      "Autodesk Takeoff unifies 2D and 3D quantification so estimators produce consistent bills of quantities from plans and models.",
      "Aptus Infotech supports preconstruction teams with Takeoff licensing and ACC integration.",
    ],
    features: [
      { title: "2D Takeoff", body: "Measure areas, lengths, and counts from PDF and sheet sets." },
      { title: "3D Takeoff", body: "Extract quantities directly from coordinated BIM models." },
      { title: "Cloud Collaboration", body: "Share takeoff packages with estimators and project teams." },
      { title: "ACC Integration", body: "Connect estimating with Docs and project workflows." },
    ],
  }),
  navisworks: buildProductPage({
    label: "Navisworks",
    metaDescription:
      "Navisworks — project review software for 3D coordination, clash detection, and simulation.",
    subtitle: "Aggregate models, detect clashes, and simulate project outcomes",
    introTitle: { before: "Coordinate Before", accent: "You Build" },
    introParagraphs: [
      "Navisworks combines models from multiple disciplines to run clash detection, 4D simulation, and project review.",
      "License Navisworks Manage or Freedom through Aptus Infotech for BIM coordination on complex projects.",
    ],
    features: [
      { title: "Clash Detection", body: "Identify and report interferences across architectural and MEP models." },
      { title: "Model Aggregation", body: "Combine Revit, Civil 3D, and other formats in one review environment." },
      { title: "4D Simulation", body: "Link schedules to models for construction sequencing." },
      { title: "Collaboration", body: "Share clash results and viewpoints with project stakeholders." },
    ],
  }),
  infodrainage: buildProductPage({
    label: "InfoDrainage",
    metaDescription:
      "InfoDrainage — drainage design and analysis for sustainable stormwater and foul water systems.",
    subtitle: "Drainage design for compliant stormwater and wastewater networks",
    introTitle: { before: "Design", accent: "Drainage Networks" },
    introParagraphs: [
      "InfoDrainage supports sustainable drainage design with analysis for attenuation, treatment, and connection to wider networks.",
      "Aptus Infotech provides InfoDrainage as part of Autodesk's water infrastructure portfolio.",
    ],
    features: [
      { title: "Stormwater Design", body: "Size pipes, channels, and storage for rainfall events." },
      { title: "SuDS & Treatment", body: "Model sustainable drainage and treatment components." },
      { title: "Standards Compliance", body: "Apply regional design standards and reporting requirements." },
      { title: "CAD Integration", body: "Exchange results with Civil 3D and InfoWorks platforms." },
    ],
  }),
  infowaterPro: buildProductPage({
    label: "InfoWater Pro",
    metaDescription:
      "InfoWater Pro — advanced water distribution modeling and analysis for utilities and consultants.",
    subtitle: "Advanced modeling for water distribution systems",
    introTitle: { before: "Optimize", accent: "Water Networks" },
    introParagraphs: [
      "InfoWater Pro helps utilities and engineers model, analyze, and optimize pressurized water distribution systems.",
      "Contact Aptus Infotech for licensing and support for water infrastructure projects in Oman.",
    ],
    features: [
      { title: "Hydraulic Modeling", body: "Simulate flows, pressures, and demands across distribution networks." },
      { title: "Water Quality", body: "Analyze chlorine decay and water age in the network." },
      { title: "Scenario Planning", body: "Test growth, failures, and operational changes before implementation." },
      { title: "GIS Integration", body: "Build models from GIS and asset data." },
    ],
  }),
  infoworksIcm: buildProductPage({
    label: "InfoWorks ICM",
    metaDescription:
      "InfoWorks ICM — integrated catchment modeling for urban drainage and wastewater networks.",
    subtitle: "Integrated catchment modeling for urban drainage and wastewater",
    introTitle: { before: "Model", accent: "Catchments" },
    introParagraphs: [
      "InfoWorks ICM combines hydrology and hydraulics for integrated modeling of urban drainage, rivers, and wastewater systems.",
      "Aptus Infotech supports consultants and utilities adopting Autodesk water modeling solutions.",
    ],
    features: [
      { title: "Integrated Modeling", body: "Surface, sewer, and river systems in one dynamic model." },
      { title: "Flood Analysis", body: "Assess flood risk and mitigation strategies for urban areas." },
      { title: "Wastewater Networks", body: "Design and analyze foul water collection systems." },
      { title: "Scenario Testing", body: "Evaluate climate, growth, and operational scenarios." },
    ],
  }),
  infoworksWsPro: buildProductPage({
    label: "InfoWorks WS Pro",
    metaDescription:
      "InfoWorks WS Pro — water supply network modeling, analysis, and optimization for distribution systems.",
    subtitle: "Water supply network modeling and optimization",
    introTitle: { before: "Plan", accent: "Water Supply" },
    introParagraphs: [
      "InfoWorks WS Pro delivers detailed modeling for water distribution planning, operation, and asset management.",
      "License InfoWorks WS Pro through Aptus Infotech — your Autodesk partner for water infrastructure in Oman.",
    ],
    features: [
      { title: "Distribution Analysis", body: "Model pipes, pumps, valves, and storage in potable networks." },
      { title: "Operational Planning", body: "Optimize pumping schedules and pressure management." },
      { title: "Asset Insights", body: "Support capital planning with hydraulic performance data." },
      { title: "Enterprise Scale", body: "Handle large utility networks with robust simulation engines." },
    ],
  }),
};

export function getAutodeskInnerContent(key: SoftwareInnerPageKey): MarketingPageContent | null {
  if (!(key in AUTODESK_INNER_CONTENT)) return null;
  return AUTODESK_INNER_CONTENT[key as AutodeskInnerPageKey];
}

/** JSON sections only — paste into Odoo `x_page_sections_json`. */
export function toAutodeskOdooSections(content: MarketingPageContent): MarketingPageSections {
  const { metaTitle: _t, metaDescription: _d, source: _s, ...sections } = content;
  void _t;
  void _d;
  void _s;
  return sections;
}

/** Export registry labels for sub-navigation. */
export const AUTODESK_SUBNAV_LINKS = AUTODESK_INNER_PAGE_DEFS.map((def) => ({
  label: def.label,
  href: def.path,
}));

/**
 * Full Autodesk product seed content for aptus.autodesk.product.
 * Used by: scripts/seed-autodesk-products.mjs
 */

const MAILTO = "mailto:info@aptusinfotech.com";

const APTUS_BENEFITS = [
  {
    title: "Authorized Autodesk Partner",
    description:
      "Genuine licenses, official support channels, and access to current Autodesk product versions.",
    kind: "business",
  },
  {
    title: "Implementation Support",
    description:
      "Guidance on deployment, collections, and integration with your existing IT and project workflows.",
    kind: "business",
  },
  {
    title: "Local Expertise in Oman",
    description:
      "Muscat-based team providing responsive sales, technical support, and training across the GCC.",
    kind: "business",
  },
  {
    title: "Predictable Licensing & Renewal",
    description:
      "Single partner for procurement, true-up, and renewal — reducing compliance risk and admin overhead.",
    kind: "roi",
  },
];

const STANDARD_INDUSTRIES = [
  {
    title: "Architecture",
    description: "Design firms producing coordinated drawings, models, and client deliverables.",
    icon: "architecture",
  },
  {
    title: "Engineering",
    description: "Consultancies delivering analysis, design, and multidisciplinary coordination.",
    icon: "engineering",
  },
  {
    title: "Construction",
    description: "Contractors and developers managing site delivery, quality, and handover.",
    icon: "construction",
  },
  {
    title: "Infrastructure",
    description: "Utilities, transportation, and public sector capital projects.",
    icon: "infrastructure",
  },
];

const STANDARD_FAQS = (productName) => [
  {
    question: `Does Aptus Infotech supply genuine ${productName} licenses?`,
    answer:
      "Yes. Aptus Infotech is an authorized Autodesk partner in Oman. All licenses are genuine with full vendor support and update eligibility.",
  },
  {
    question: `Can Aptus help us choose the right ${productName} plan or collection?`,
    answer:
      "Our team advises on standalone products vs. industry collections (AEC, PD&M, etc.) based on your team size, disciplines, and project pipeline.",
  },
  {
    question: "Do you provide local technical support and training?",
    answer:
      "We provide implementation guidance, license administration support, and can coordinate Autodesk training for your teams in Oman.",
  },
];

function features(items) {
  return items.map(([title, description, icon]) => ({ title, description, icon }));
}

function product(def) {
  const {
    slug,
    name,
    category,
    sequence,
    subtitle,
    overview,
    description,
    highlights,
    featureItems,
    industries,
    relatedSlugs = [],
    badge,
    featured = false,
  } = def;

  return {
    name,
    url_slug: slug,
    product_category: category,
    sequence,
    is_published: true,
    is_featured: featured,
    product_badge: badge ?? "Autodesk",
    hero_title: name,
    hero_subtitle: subtitle,
    product_overview: overview,
    product_description: description,
    highlights_json: JSON.stringify(highlights, null, 2),
    features_json: JSON.stringify(features(featureItems), null, 2),
    key_benefits_json: JSON.stringify(APTUS_BENEFITS, null, 2),
    industry_applications_json: JSON.stringify(industries ?? STANDARD_INDUSTRIES, null, 2),
    faqs_json: JSON.stringify(STANDARD_FAQS(name), null, 2),
    testimonials_json: JSON.stringify(
      [
        {
          quote: `Aptus Infotech helped our team deploy ${name} with the right licensing model and local support when we needed it.`,
          author: "Project Director",
          role: "Engineering Consultancy",
          company: "Oman",
        },
      ],
      null,
      2,
    ),
    downloads_json: JSON.stringify(
      [
        {
          title: `${name} Product Overview`,
          description: "Request the product brochure and licensing guide from Aptus Infotech.",
          url: MAILTO,
          fileType: "PDF",
        },
      ],
      null,
      2,
    ),
    media_json: JSON.stringify([], null, 2),
    cta_text: `Speak with an Autodesk specialist about ${name} licensing, deployment, and support in Oman.`,
    cta_button_label: "Request a Quote",
    cta_button_url: MAILTO,
    seo_title: `${name} | Autodesk Partner Oman | Aptus Infotech`,
    seo_description: description.slice(0, 160),
    seo_keywords: `${name}, Autodesk, Oman, Aptus Infotech, software licensing`,
    related_slugs: relatedSlugs,
  };
}

/** @type {ReturnType<typeof product>[]} */
export const AUTODESK_PRODUCT_SEED = [
  product({
    slug: "autocad",
    name: "AutoCAD",
    category: "engineering_design",
    sequence: 10,
    featured: true,
    subtitle: "Precision drafting and design for architecture, engineering, and construction",
    overview:
      "AutoCAD is the world's leading CAD platform for creating precise 2D drawings and 3D models used across AEC and manufacturing teams.",
    description:
      "AutoCAD is the world's leading CAD platform for creating precise 2D drawings and 3D models. Teams use it for floor plans, schematics, mechanical parts, and construction documentation. Aptus Infotech supplies genuine AutoCAD and collection licenses with local support for installation, standards, and license management.",
    highlights: [
      "Industry-standard DWG workflows",
      "Specialized toolsets for AEC and MEP",
      "Cloud collaboration and mobile access",
    ],
    featureItems: [
      ["2D Drafting", "Precision drawing tools, dimensions, and annotation for production documentation.", "draft"],
      ["3D Modeling", "Create and edit 3D solids, surfaces, and meshes for design visualization.", "cube"],
      ["Industry Toolsets", "Architecture, mechanical, electrical, and MAP toolsets included in subscriptions.", "tools"],
      ["Collaboration", "Share drawings via Autodesk cloud and integrate with ACC workflows.", "cloud"],
    ],
    relatedSlugs: ["autocad-lt", "revit", "aec-collection"],
  }),
  product({
    slug: "3ds-max",
    name: "3ds Max",
    category: "engineering_design",
    sequence: 20,
    subtitle: "3D modeling, animation, and rendering for visualization and entertainment",
    overview:
      "3ds Max delivers professional modeling, animation, and rendering for architects, designers, and media studios.",
    description:
      "3ds Max delivers powerful modeling, animation, and rendering for architects, designers, and media professionals creating compelling visual experiences. License 3ds Max through Aptus Infotech with guidance on hardware, render engines, and collection options.",
    highlights: ["Arnold rendering integration", "Architectural visualization workflows", "Flexible modeling toolset"],
    featureItems: [
      ["Polygon Modeling", "Flexible modeling for assets, environments, and detailed geometry.", "mesh"],
      ["Animation & Rigging", "Character animation, constraints, and procedural animation tools.", "motion"],
      ["Rendering", "Arnold and other render integrations for photorealistic output.", "render"],
      ["Visualization", "Ideal for architectural marketing and design review visuals.", "eye"],
    ],
    relatedSlugs: ["revit", "autocad"],
  }),
  product({
    slug: "revit",
    name: "Revit",
    category: "engineering_design",
    sequence: 30,
    featured: true,
    subtitle: "BIM platform for coordinated architectural, structural, and MEP design",
    overview:
      "Revit supports multidisciplinary BIM workflows so teams design, document, and coordinate in a single model environment.",
    description:
      "Revit supports multidisciplinary BIM workflows so teams design, document, and coordinate in a single model environment. Aptus Infotech helps firms adopt Revit with the right licenses, templates, and rollout planning.",
    highlights: ["Parametric building modeling", "Coordinated discipline models", "Construction documentation from BIM"],
    featureItems: [
      ["Parametric Modeling", "Change any element and Revit updates related views and schedules.", "parametric"],
      ["Discipline Tools", "Architecture, structure, and MEP in coordinated project models.", "discipline"],
      ["Documentation", "Sheets, schedules, and construction documentation from the model.", "docs"],
      ["Interoperability", "Exchange with Navisworks, ACC, and other Autodesk platforms.", "sync"],
    ],
    relatedSlugs: ["navisworks", "aec-collection", "bim-collaborate-pro"],
  }),
  product({
    slug: "civil-3d",
    name: "Civil 3D",
    category: "engineering_design",
    sequence: 40,
    subtitle: "Civil engineering design for transportation, land, and water projects",
    overview:
      "Civil 3D connects design and documentation for civil infrastructure with dynamic corridors, surfaces, and pipe networks.",
    description:
      "Civil 3D connects design and documentation for civil infrastructure with dynamic model-based corridors, surfaces, and pipe networks. Aptus Infotech supports civil consultants and contractors with licensing and implementation for projects in Oman.",
    highlights: ["Corridor-based road design", "Survey and surface modeling", "Pipe network design"],
    featureItems: [
      ["Corridor Modeling", "Road and rail corridor design with dynamic alignments and assemblies.", "road"],
      ["Survey & Surfaces", "Import survey data and build existing ground and design surfaces.", "survey"],
      ["Pipe Networks", "Gravity and pressure pipe design with parts catalogs and analysis.", "pipe"],
      ["Production Drafting", "Plan and profile sheets generated from the civil model.", "sheet"],
    ],
    relatedSlugs: ["infodrainage", "infowater-pro", "aec-collection"],
  }),
  product({
    slug: "autocad-lt",
    name: "AutoCAD LT",
    category: "engineering_design",
    sequence: 50,
    subtitle: "Reliable 2D drafting and documentation at a lower cost",
    overview:
      "AutoCAD LT provides core 2D drafting for professionals who do not require full AutoCAD toolsets or 3D modeling.",
    description:
      "AutoCAD LT provides core 2D drafting capabilities for professionals who do not require full AutoCAD toolsets or 3D modeling. Aptus Infotech supplies AutoCAD LT for individuals and teams with genuine licensing and renewal support.",
    highlights: ["Cost-effective 2D CAD", "DWG compatibility", "Web and mobile viewing"],
    featureItems: [
      ["2D Drafting", "Drawing, editing, and annotation tools for DWG-based workflows.", "draft"],
      ["DWG Compatibility", "Work with standard DWG files used across the industry.", "file"],
      ["Web & Mobile", "View and edit drawings through AutoCAD web and mobile apps.", "mobile"],
      ["Affordable Access", "Lower-cost option for documentation-focused roles.", "value"],
    ],
    relatedSlugs: ["autocad", "revit"],
  }),
  product({
    slug: "aec-collection",
    name: "AEC Collection",
    category: "aec_bim",
    sequence: 60,
    featured: true,
    subtitle: "The essential BIM and CAD toolkit for architecture, engineering, and construction",
    overview:
      "The AEC Collection bundles Revit, AutoCAD, Civil 3D, InfraWorks, Navisworks Manage, and more for building and infrastructure teams.",
    description:
      "The AEC Collection includes Revit, AutoCAD, Civil 3D, InfraWorks, Navisworks Manage, and more — optimized for building and infrastructure teams. Aptus Infotech advises on collection vs. single-product licensing and helps align purchases with your team structure.",
    highlights: ["Best value for multi-discipline teams", "Includes Navisworks coordination", "Cloud services included"],
    featureItems: [
      ["BIM & CAD Together", "Access Revit, AutoCAD, and Civil 3D under one subscription.", "bundle"],
      ["Coordination", "Navisworks for clash detection and model aggregation.", "clash"],
      ["Conceptual Design", "InfraWorks for early-stage planning and visualization.", "concept"],
      ["Team Value", "Cost-effective when multiple disciplines need Autodesk tools.", "team"],
    ],
    relatedSlugs: ["revit", "navisworks", "bim-collaborate-pro"],
  }),
  product({
    slug: "bim-collaborate-pro",
    name: "BIM Collaborate Pro",
    category: "aec_bim",
    sequence: 70,
    subtitle: "Cloud-based design review and model coordination",
    overview:
      "BIM Collaborate Pro enables teams to review models, track issues, and coordinate designs in the cloud.",
    description:
      "BIM Collaborate Pro enables teams to review models, track issues, and coordinate designs without exchanging heavy files manually. Aptus Infotech supports ACC subscriptions including BIM Collaborate Pro for design and contractor teams.",
    highlights: ["Browser-based model review", "Centralized issue tracking", "Autodesk Construction Cloud"],
    featureItems: [
      ["Design Review", "Review 2D and 3D files in the browser with markup tools.", "review"],
      ["Issue Tracking", "Assign, track, and resolve clashes and design issues centrally.", "issue"],
      ["Version Control", "Work from current models with clear version history.", "version"],
      ["ACC Integration", "Part of Autodesk Construction Cloud for end-to-end delivery.", "cloud"],
    ],
    relatedSlugs: ["autodesk-docs", "navisworks", "autodesk-build"],
  }),
  product({
    slug: "autodesk-docs",
    name: "Autodesk Docs",
    category: "aec_bim",
    sequence: 80,
    subtitle: "Controlled document management for construction projects",
    overview:
      "Autodesk Docs provides a common data environment for storing, reviewing, and distributing project documents.",
    description:
      "Autodesk Docs provides a common data environment for storing, reviewing, and distributing project documents across stakeholders. Deploy Docs with support from Aptus Infotech as part of your digital project delivery strategy.",
    highlights: ["CDE for construction", "Revision and approval workflows", "Role-based access"],
    featureItems: [
      ["Document Control", "Manage revisions and approvals for drawings and specifications.", "control"],
      ["Access Permissions", "Role-based access for clients, consultants, and contractors.", "access"],
      ["ACC Platform", "Foundation for Build, Takeoff, and BIM Collaborate workflows.", "platform"],
      ["Audit Trail", "Track who viewed and approved each document version.", "audit"],
    ],
    relatedSlugs: ["autodesk-build", "bim-collaborate-pro", "autodesk-takeoff"],
  }),
  product({
    slug: "autodesk-build",
    name: "Autodesk Build",
    category: "aec_bim",
    sequence: 90,
    subtitle: "Field management for quality, safety, and daily site operations",
    overview:
      "Autodesk Build connects site teams with the office through mobile field management on ACC.",
    description:
      "Autodesk Build helps field teams capture issues, inspections, photos, and RFIs on mobile devices synced with the project record. Aptus Infotech licenses Build for contractors adopting Autodesk Construction Cloud in Oman.",
    highlights: ["Mobile field workflows", "RFIs and inspections", "Photo documentation"],
    featureItems: [
      ["Quality & Safety", "Checklists, inspections, and issue capture in the field.", "safety"],
      ["RFIs & Submittals", "Streamline communication between site and design teams.", "rfi"],
      ["Photo Documentation", "Attach geotagged photos to locations and activities.", "photo"],
      ["Dashboards", "Monitor progress and open items across projects.", "dashboard"],
    ],
    relatedSlugs: ["autodesk-docs", "autodesk-takeoff", "bim-collaborate-pro"],
  }),
  product({
    slug: "autodesk-takeoff",
    name: "Autodesk Takeoff",
    category: "aec_bim",
    sequence: 100,
    subtitle: "2D and 3D quantity takeoff for faster, accurate estimating",
    overview:
      "Autodesk Takeoff unifies 2D and 3D quantification for consistent bills of quantities.",
    description:
      "Autodesk Takeoff unifies 2D and 3D quantification so estimators produce consistent bills of quantities from plans and models. Aptus Infotech supports preconstruction teams with Takeoff licensing and ACC integration.",
    highlights: ["2D and 3D takeoff", "Cloud collaboration", "ACC integration"],
    featureItems: [
      ["2D Takeoff", "Measure areas, lengths, and counts from PDF and sheet sets.", "2d"],
      ["3D Takeoff", "Extract quantities directly from coordinated BIM models.", "3d"],
      ["Cloud Collaboration", "Share takeoff packages with estimators and project teams.", "cloud"],
      ["ACC Integration", "Connect estimating with Docs and project workflows.", "link"],
    ],
    relatedSlugs: ["autodesk-docs", "navisworks", "autodesk-build"],
  }),
  product({
    slug: "navisworks",
    name: "Navisworks",
    category: "aec_bim",
    sequence: 110,
    subtitle: "Aggregate models, detect clashes, and simulate project outcomes",
    overview:
      "Navisworks combines models from multiple disciplines for clash detection, 4D simulation, and review.",
    description:
      "Navisworks combines models from multiple disciplines to run clash detection, 4D simulation, and project review. License Navisworks Manage through Aptus Infotech for BIM coordination on complex projects.",
    highlights: ["Clash detection", "4D simulation", "Multi-format aggregation"],
    featureItems: [
      ["Clash Detection", "Identify interferences across architectural and MEP models.", "clash"],
      ["Model Aggregation", "Combine Revit, Civil 3D, and other formats in one environment.", "aggregate"],
      ["4D Simulation", "Link schedules to models for construction sequencing.", "4d"],
      ["Collaboration", "Share clash results and viewpoints with stakeholders.", "share"],
    ],
    relatedSlugs: ["revit", "aec-collection", "bim-collaborate-pro"],
  }),
  product({
    slug: "infodrainage",
    name: "InfoDrainage",
    category: "water_infrastructure",
    sequence: 120,
    subtitle: "Drainage design for compliant stormwater and wastewater networks",
    overview:
      "InfoDrainage supports sustainable drainage design with analysis for attenuation, treatment, and network connections.",
    description:
      "InfoDrainage supports sustainable drainage design with analysis for attenuation, treatment, and connection to wider networks. Aptus Infotech provides InfoDrainage as part of Autodesk's water infrastructure portfolio.",
    highlights: ["SuDS design", "Standards-based reporting", "Civil 3D integration"],
    featureItems: [
      ["Stormwater Design", "Size pipes, channels, and storage for rainfall events.", "storm"],
      ["SuDS & Treatment", "Model sustainable drainage and treatment components.", "suds"],
      ["Standards Compliance", "Apply regional design standards and reporting requirements.", "standard"],
      ["CAD Integration", "Exchange results with Civil 3D and InfoWorks platforms.", "cad"],
    ],
    industries: [
      { title: "Civil Engineering", description: "Consultancies designing drainage for developments and highways.", icon: "civil" },
      { title: "Utilities", description: "Water and wastewater operators planning network upgrades.", icon: "utility" },
      { title: "Infrastructure", description: "Public sector capital projects with stormwater obligations.", icon: "infrastructure" },
      { title: "Construction", description: "Contractors validating drainage designs before site works.", icon: "construction" },
    ],
    relatedSlugs: ["civil-3d", "infoworks-icm", "infowater-pro"],
  }),
  product({
    slug: "infowater-pro",
    name: "InfoWater Pro",
    category: "water_infrastructure",
    sequence: 130,
    subtitle: "Advanced modeling for water distribution systems",
    overview:
      "InfoWater Pro helps utilities and engineers model, analyze, and optimize pressurized water distribution systems.",
    description:
      "InfoWater Pro helps utilities and engineers model, analyze, and optimize pressurized water distribution systems. Contact Aptus Infotech for licensing and support for water infrastructure projects in Oman.",
    highlights: ["Hydraulic modeling", "Water quality analysis", "GIS integration"],
    featureItems: [
      ["Hydraulic Modeling", "Simulate flows, pressures, and demands across distribution networks.", "hydraulic"],
      ["Water Quality", "Analyze chlorine decay and water age in the network.", "quality"],
      ["Scenario Planning", "Test growth, failures, and operational changes before implementation.", "scenario"],
      ["GIS Integration", "Build models from GIS and asset data.", "gis"],
    ],
    industries: [
      { title: "Water Utilities", description: "Operators managing potable distribution networks.", icon: "utility" },
      { title: "Engineering", description: "Consultants designing and validating water master plans.", icon: "engineering" },
      { title: "Infrastructure", description: "Municipal and regional infrastructure programs.", icon: "infrastructure" },
      { title: "Construction", description: "EPC contractors delivering water network projects.", icon: "construction" },
    ],
    relatedSlugs: ["infoworks-ws-pro", "infodrainage", "civil-3d"],
  }),
  product({
    slug: "infoworks-icm",
    name: "InfoWorks ICM",
    category: "water_infrastructure",
    sequence: 140,
    subtitle: "Integrated catchment modeling for urban drainage and wastewater",
    overview:
      "InfoWorks ICM combines hydrology and hydraulics for integrated modeling of urban drainage and wastewater.",
    description:
      "InfoWorks ICM combines hydrology and hydraulics for integrated modeling of urban drainage, rivers, and wastewater systems. Aptus Infotech supports consultants and utilities adopting Autodesk water modeling solutions.",
    highlights: ["Integrated catchment models", "Flood risk analysis", "Wastewater network design"],
    featureItems: [
      ["Integrated Modeling", "Surface, sewer, and river systems in one dynamic model.", "integrated"],
      ["Flood Analysis", "Assess flood risk and mitigation strategies for urban areas.", "flood"],
      ["Wastewater Networks", "Design and analyze foul water collection systems.", "wastewater"],
      ["Scenario Testing", "Evaluate climate, growth, and operational scenarios.", "scenario"],
    ],
    relatedSlugs: ["infodrainage", "infowater-pro", "infoworks-ws-pro"],
  }),
  product({
    slug: "infoworks-ws-pro",
    name: "InfoWorks WS Pro",
    category: "water_infrastructure",
    sequence: 150,
    subtitle: "Water supply network modeling and optimization",
    overview:
      "InfoWorks WS Pro delivers detailed modeling for water distribution planning, operation, and asset management.",
    description:
      "InfoWorks WS Pro delivers detailed modeling for water distribution planning, operation, and asset management. License InfoWorks WS Pro through Aptus Infotech — your Autodesk partner for water infrastructure in Oman.",
    highlights: ["Distribution network modeling", "Operational optimization", "Enterprise-scale simulation"],
    featureItems: [
      ["Distribution Analysis", "Model pipes, pumps, valves, and storage in potable networks.", "network"],
      ["Operational Planning", "Optimize pumping schedules and pressure management.", "ops"],
      ["Asset Insights", "Support capital planning with hydraulic performance data.", "asset"],
      ["Enterprise Scale", "Handle large utility networks with robust simulation engines.", "scale"],
    ],
    relatedSlugs: ["infowater-pro", "infoworks-icm", "infodrainage"],
  }),
];

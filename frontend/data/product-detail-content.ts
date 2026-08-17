/**
 * Portal product detail tab content — 8 Autodesk products.
 * Tabs: Overview · Key Features · What's Included · Subscription and Licensing Options · Price Details
 */

export type ProductDetailBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type ProductDetailContent = {
  overview: ProductDetailBlock[];
  keyFeatures: ProductDetailBlock[];
  whatsIncluded: ProductDetailBlock[];
  subscriptionLicensing: ProductDetailBlock[];
};

export const PORTAL_PRODUCT_NAMES = [
  "AutoCAD",
  "Civil 3D",
  "AEC Collection",
  "AutoCAD LT",
  "AutoCAD Revit LT Suite",
  "3ds Max",
  "Navisworks Manage",
  "Revit",
] as const;

function buildProductContent(input: {
  overview: string;
  keyFeatures: string[];
  whatsIncluded: Array<[string, string, string]>;
  subscriptionLicensing: string[];
}): ProductDetailContent {
  const subscriptionRows = input.subscriptionLicensing.map((item) => {
    const splitAt = item.indexOf(": ");
    if (splitAt === -1) return [item, ""] as [string, string];
    return [item.slice(0, splitAt), item.slice(splitAt + 2)] as [string, string];
  });

  return {
    overview: [{ type: "p", text: input.overview }],
    keyFeatures: [{ type: "ul", items: input.keyFeatures }],
    whatsIncluded: [
      {
        type: "table",
        headers: ["Included Component", "Description", "Delivery Method"],
        rows: input.whatsIncluded,
      },
    ],
    subscriptionLicensing: [
      {
        type: "table",
        headers: ["Licensing Option", "Description"],
        rows: subscriptionRows,
      },
    ],
  };
}

const CONTENT: Record<string, ProductDetailContent> = {
  autocad: buildProductContent({
    overview:
      "Autodesk® AutoCAD® — including specialized toolsets AD is the comprehensive 2D drafting and 3D modeling platform used globally by architects, design engineers, and construction professionals. This licensing bundle covers brand-new workplace integrations (Commercial New) as well as active team contract extensions (Renewal Subscription). Delivered via cloud-native Electronic License Delivery (ELD), this primary subscription gives users full access to full-scale AutoCAD automation engines, specialized industry libraries, and deep project collaboration utilities via the built-in Autodesk Account Portal.",
    keyFeatures: [
      "Seven Industry-Specific Toolsets: Access pre-configured automation libraries for architecture, mechanical engineering, electrical control systems, MEP, 3D plant design, mapping/GIS, and raster-to-vector workflows.",
      "Automated Geometry Cleanup Engine: Speeds up file auditing loops by systematically finding and fixing geometric discrepancies like disjointed gaps, overlapping vectors, and misaligned drawing angles.",
      "AI-Enhanced Autodesk Assistant: Employs interactive natural language chat mechanics directly in the application to help users audit project standards and optimize production drafting commands.",
      "Granular Collaboration Overlays: Leverages a cloud-native checkout protocol that enables team members to isolate and edit individual geometry subsets within dedicated trace environments, ensuring safer file management.",
      "Forma Cloud Hub Integration: Unifies file structure pathways by syncing drawing files, connected customization catalogs (CUIx), and structural external reference files (Xrefs) directly onto a central cloud canvas.",
    ],
    whatsIncluded: [
      ["AutoCAD 2027 Desktop Core", "The flagship precision application supporting general 2D blueprint design and full 3D modeling.", "Electronic Download (ELD)"],
      ["Industry Toolsets (7 Packs)", "Architectural, Mechanical, Electrical, MEP, Plant 3D, Map 3D, and Raster Design vertical additions.", "On-Demand Installation Portal"],
      ["AutoCAD Web Application", "Browser client optimized to overlay design work onto web canvases and edit DWG data dynamically.", "Cloud Workspace Access"],
      ["AutoCAD Mobile Application", "Field-ready vector editing and design review app configured for mobile hardware deployments.", "App Store Digital Access"],
      ["Forma Data Management", "Cloud central coordination dashboard providing issue management and tracking tools.", "Integrated Web Utilities"],
      ["Autodesk Support Network", "1-on-1 priority digital troubleshooting, support tickets, and version legacy access options.", "Digital Admin Portal"],
    ],
    subscriptionLicensing: [
      "Commercial New Seat Selection: Deploys an individual workstation workspace to increase technical design staff capacities or provision incoming design personnel.",
      "Renewal Subscription Configuration: Extends active enterprise drawing privileges seamlessly, preserving assigned user IDs and project database connectivity.",
      "Named Single-User Architecture: Ties license registration and identity verification parameters safely to an operator's active email ID via the Autodesk Store Portal.",
      "Procurement Duration Frameworks: Available for transaction or contractual extension under flexible Annual (12-Month) or price-stabilized 3-Year (36-Month) structural models.",
    ],
  }),

  "civil 3d": buildProductContent({
    overview:
      "Autodesk Civil 3D® 2027 is the industry-leading civil engineering design and documentation software used to model highways, land development, rail networks, and water projects. This product offering covers both brand-new team deployments (Commercial New) and contract extensions for active users (Renewal Subscription). Delivered instantly via Electronic License Delivery (ELD), Civil 3D 2027 incorporates advanced corridors modeling, gravity pipe network enhancements, and cloud-native workflows to streamline large-scale infrastructure design.",
    keyFeatures: [
      "Advanced Corridor Modeling: Build, modify, and calculate materials for complex roadway corridors with dynamic cross-sections and transitional grading rules.",
      "Intelligent Pressure & Gravity Pipe Networks: Layout stormwater, sanitary sewer, and water systems using rule-based pipe parameters that dynamically adjust during site grading updates.",
      "Geospatial & ArcGIS Integration: Connect GIS data directly into your design surface environments to maintain accurate geographical parameters across teams.",
      "Automated Production Drafting: Rapidly generate plan-and-profile sheets, cross-sections, and technical documentation using automated, object-based styling.",
      "Autodesk Construction Cloud Sync: Share surfaces, alignments, and pipe networks with external stakeholders seamlessly through data shortcuts hosted securely in the cloud.",
    ],
    whatsIncluded: [
      ["Civil 3D 2027 Desktop", "Full infrastructure engineering environment for Windows systems.", "Electronic Download (ELD)"],
      ["Autodesk Storm and Sanitary Analysis", "Advanced hydrology and hydraulic analysis tools for comprehensive drainage engineering.", "Bundled Desktop Module"],
      ["Grading Optimization", "Automated, algorithmic site-grading utility designed to find optimal balances across earthwork volumes.", "Integrated Extension"],
      ["Project Explorer", "Specialized hub used to review, audit, validate, and report on complex Civil 3D model data.", "Integrated Core Tool"],
      ["Standard Autodesk Support", "1-on-1 technical assistance, ticket resolution, and community expert forums.", "Digital Account Portal"],
    ],
    subscriptionLicensing: [
      "Commercial New Path: Select this option when creating a fresh workspace license to expand your engineering staff or start a new infrastructure project.",
      "Renewal Subscription Path: Choose this route to extend your active software contracts natively, avoiding downtime or lockouts from ongoing project data shortcuts.",
      "Named Single-User Architecture: Tied directly to an employee's professional Autodesk ID profile for secure, remote administrative management.",
      "Duration Frameworks: Available for purchase or contract renewal in flexible Annual (12-Month) or price-stabilized 3-Year (36-Month) terms.",
    ],
  }),

  "aec collection": buildProductContent({
    overview:
      "The Autodesk® Architecture, Engineering & Construction (AEC) Collection is an industry-leading, multi-disciplinary software suite tailored for architects, civil infrastructure engineers, MEP specialists, and construction contractors. This comprehensive offering covers brand-new team deployments (Commercial New) as well as contract extensions for active deployments (Renewal Subscription). Delivered via Electronic License Delivery (ELD), the AEC Collection combines full-scale BIM capabilities with professional 2D/3D CAD design engines, enabling a smooth transition from early-stage site mapping and concept design through to execution and on-site construction coordination.",
    keyFeatures: [
      "Integrated Multi-Disciplinary BIM Workflows: Design buildings and large infrastructure assets concurrently by sharing data dynamically between Revit, Civil 3D, and Infraworks.",
      "Centralized Common Data Environment (CDE): Built-in document management powered by cloud storage tools helps teams store files, track markups, and manage permissions to international standards.",
      "Advanced Clash Detection & Preconstruction Auditing: Mitigate risk on site by aggregating multi-format 3D meshes to isolate interferences, clearances, and structural conflicts before breaking ground.",
      "Reality Capture & Visualizations: Process aerial or ground point-cloud datasets into scalable, parametric geometries, and render photorealistic animations for presentation.",
      "Structural and Environmental Simulations: Perform native analysis tasks—such as linear stress profiling, code-compliance checks, and carbon tracking—without needing separate data conversion suites.",
    ],
    whatsIncluded: [
      ["Autodesk Revit", "Comprehensive software for architectural design, structural engineering, and MEP systems.", "Electronic Download (ELD)"],
      ["Autodesk AutoCAD", "Core desktop application equipped with industry-specific modules (Architecture, Electrical, Mechanical).", "Electronic Download (ELD)"],
      ["Autodesk Civil 3D", "Civil engineering design software configured for detailing highway corridors, grading, and piping networks.", "Electronic Download (ELD)"],
      ["Navisworks Manage", "Elite model federation platform hosting Clash Detective tools and automated time/cost tracking simulations.", "Electronic Download (ELD)"],
      ["Autodesk Docs & Forma", "Cloud-native data coordination tools used for conceptual early-stage analytics and documentation review.", "Cloud Access / Hub Interface"],
      ["Advanced Tools Suite", "Special access to 3ds Max, InfraWorks, ReCap Pro, Robot Structural Analysis, and Vehicle Tracking.", "Mixed Desktop & Cloud Download"],
    ],
    subscriptionLicensing: [
      "Commercial New Plan: Installs an entirely fresh group of licenses to increase your office footprint or provision newly hired engineering staff.",
      "Renewal Subscription Plan: Seamlessly extends active user terms to avoid workflow disruptions or lockouts from linked project data hubs.",
      "Named Single-User Architecture: Tied directly to designated professional identities using Autodesk IDs, which administrators can assign or reallocate via the web management portal.",
      "Duration Frameworks: Available to procure through flexible, cost-optimized Annual (12-Month) terms or fixed-rate 3-Year (36-Month) commitments.",
    ],
  }),

  "autocad lt": buildProductContent({
    overview:
      "AutoCAD LT® 2027 is the industry-standard 2D drafting and documentation software designed for architects, engineers, construction professionals, and designers. This product offering covers both brand-new seat setups (Commercial New) and contract extensions for active deployments (Renew Subscription). Delivered via Electronic License Delivery (ELD), the 2027 edition optimizes performance across Windows and macOS with new AI-driven tools, automated drafting cleanup, and seamless cloud data integration.",
    keyFeatures: [
      "Automated Geometry Cleanup: Speeds up drafting audits by automatically detecting and repairing common 2D drawing errors like gaps, overshoots, and misaligned angles.",
      "AI-Powered Autodesk Assistant: Provides real-time, prompt-driven technical support and solutions directly within your drafting workspace.",
      "Forma Data Integration: Built-in cloud data management that seamlessly syncs drawings, Connected Support Files (CUIx), and external references (Xrefs).",
      "Enhanced Performance: Optimized graphics and processing engines deliver significantly faster layout tab switching and file loading times.",
      "Multi-Platform Flexibility: Work seamlessly across devices with the core desktop software, AutoCAD Web app, and mobile design tools.",
    ],
    whatsIncluded: [
      ["AutoCAD LT 2027 Desktop", "Full installation for Windows and macOS environments.", "Electronic Download (ELD)"],
      ["AutoCAD Web App", "Browser-based access to view, edit, and share CAD files on any computer.", "Cloud Access"],
      ["AutoCAD Mobile App", "Design, edit, and markup tools optimized for iOS and Android devices.", "App Store Download"],
      ["Autodesk Support", "1-on-1 expert technical assistance and comprehensive digital self-help.", "Digital / Account Portal"],
      ["Forma Cloud Hub", "Centralized project cloud hosting for support files and external references.", "Integrated Cloud"],
    ],
    subscriptionLicensing: [
      "Commercial New Selection: Select this configuration when adding a brand-new user workspace to your design office or expanding your immediate project headcount.",
      "Renew Subscription Configuration: Select this track to extend an existing, active contract, preventing license expiration and maintaining uninterrupted cloud data streams.",
      "Named Single-User License: Ties software activation parameters strictly to an assigned professional's Autodesk ID profile via the cloud admin portal.",
      "Subscription Frameworks: Available for purchase or renewal in cost-effective Annual (12-Month) or price-stabilized 3-Year (36-Month) terms.",
    ],
  }),

  "autocad revit lt suite": buildProductContent({
    overview:
      "AutoCAD Revit LT Suite 2027 is an essential BIM and 2D drafting package combining Revit LT and AutoCAD LT into a single cost-effective solution. This product offering covers both brand-new team deployments (Commercial New) and seamless contract extensions (Renew Subscription). Delivered via Electronic License Delivery (ELD), the 2027 suite provides independent architects, small design practices, and structural engineers with a bridge to modern Building Information Modeling (BIM) workflows while preserving a fully compatible, industry-standard 2D environment.",
    keyFeatures: [
      "Integrated 3D BIM & 2D Workspaces: Work inside a cohesive environment that switches smoothly between 3D parametric design in Revit LT and precision 2D drafting in AutoCAD LT.",
      "Automated Documentation Sync: Drastically reduces drafting revision times by automatically updating floor plans, elevations, sections, and schedules whenever a 3D model change is made.",
      "Automated Geometry Cleanup: Leverages the new AutoCAD LT utility to automatically find and repair misaligned vectors, gaps, and overshoots in traditional legacy files.",
      "AI-Enhanced Autodesk Assistant: Integrates prompt-driven conversational support within the workspace to instantly audit standards and troubleshoot command workflows.",
      "Forma Cloud Hub Coordination: Natively syncs drawings, connected support libraries (CUIx), and external reference drawings (Xrefs) into a central cloud workspace without manual transfers.",
    ],
    whatsIncluded: [
      ["Revit LT 2027", "Core 3D architectural modeling software for intelligent, parametric object-based design.", "Electronic Download (ELD)"],
      ["AutoCAD LT 2027", "Industry-standard 2D drafting, geometry cleanup, and detailing software.", "Electronic Download (ELD)"],
      ["AutoCAD Web App", "Browser-based CAD client configured to view, edit, and markup DWG files on any computer.", "Integrated Cloud Access"],
      ["AutoCAD Mobile App", "Mobile application optimized for on-site design review across iOS and Android devices.", "App Store Download"],
      ["Forma Data Cloud", "Centralized project cloud hosting for support files, project assets, and reference models.", "Cloud Space Integration"],
      ["Autodesk Standard Support", "1-on-1 expert technical assistance, system ticketing, and comprehensive self-help portals.", "Digital Admin Portal"],
    ],
    subscriptionLicensing: [
      "Commercial New Selection: Select this configuration when adding a brand-new user workspace to your design office or expanding your immediate project headcount.",
      "Renew Subscription Configuration: Select this track to extend an existing, active contract, preventing license expiration and maintaining uninterrupted cloud data streams.",
      "Named Single-User License: Ties application activation parameters strictly to an assigned professional's Autodesk ID profile via the cloud admin portal.",
      "Subscription Frameworks: Available for purchase or renewal in cost-effective Annual (12-Month) or price-stabilized 3-Year (36-Month) terms.",
    ],
  }),

  "3ds max": buildProductContent({
    overview:
      "Autodesk 3ds Max® is a premier 3D modeling, animation, fluid simulation, and rendering platform tailored for game developers, visual effects (VFX) artists, and architectural visualization professionals. This product tier covers both brand-new seat setups (Commercial New) and contract extensions for active deployments (Renew Subscription). Delivered via Electronic License Delivery (ELD), 3ds Max optimizes complex, data-heavy scene generation with built-in cloud rendering technology and procedural asset tools tailored exclusively for modern Windows 11 workflows.",
    keyFeatures: [
      "Smart Bevel Systems: Handles complex, dense geometries seamlessly by cleanly adapting mesh edges post-Boolean operation.",
      "Procedural Noise Plus: Features simplex-based fractal pattern controls, full 3D tileable axes mapping, and instant normal direction alignment.",
      "Volumetric Field Helpers: Uses quick-selection 3D volumes (spheres, toruses, or custom scene nodes) linked to multi-map datasets to speed up modification workflows.",
      "Flow Render Tech Preview: Expands render capabilities directly into the cloud, enabling frictionless heavy background task rendering without draining local resources.",
      "Autodesk Assistant (AI-Powered): Introduces prompt-driven conversational AI right inside the dashboard to search pipelines, resolve features, and check technical script properties.",
    ],
    whatsIncluded: [
      ["3ds Max Desktop Suite", "Core application setup focusing on high-poly modeling, rigging, texturing, and fx dynamics.", "Electronic Download (ELD)"],
      ["Arnold for 3ds Max (MAXtoA)", "Advanced photorealistic path-tracing render engine integrated natively into standard viewports.", "Bundled Desktop Plugin"],
      ["USD for 3ds Max Plugin", "Full framework to assemble, edit, and pass robust Universal Scene Description pipelines natively.", "Integrated Core Package"],
      ["Flow Render Cloud Access", "Subscribed access portal allowing on-demand cloud rendering offloads.", "Integrated Cloud Utilities"],
      ["Autodesk Standard Support", "Direct 1-on-1 account access for system error tracking, community expert access, and version migrations.", "Digital Admin Portal"],
    ],
    subscriptionLicensing: [
      "Commercial New Path: Intended for adding an entirely unique seat instance to your studio or establishing software profiles for newly onboarded team members.",
      "Renew Subscription Path: Extends working accounts seamlessly before active deployment dates drop, preventing cloud rendering downtime.",
      "Named Single-User License: Ties usage to specific personnel profiles through verified email logins handled within the cloud management center.",
      "Subscription Architecture: Available via flexible billing structures spanning Annual (12-Month) or price-stabilized 3-Year terms directly.",
    ],
  }),

  "navisworks manage": buildProductContent({
    overview:
      "Navisworks Manage 2027 is the leading project review and coordination software designed for architecture, engineering, and construction (AEC) professionals. This software allows teams to aggregate 3D models from multiple disciplines into a single integrated system to run advanced interference analysis. Delivered instantly via Electronic License Delivery (ELD), this subscription accommodates brand-new procurement (Commercial New) or seamless extensions for active users (Renewal Subscription). The 2027 version leverages a completely redesigned clash management engine and direct cloud file integrations to streamline preconstruction verification.",
    keyFeatures: [
      "Redesigned Clash Detective Engine: Offers a modernized main interface layout where teams can group, sort, and run multiple clash tests simultaneously across folders.",
      "True Model Aggregation: Integrates and loads massive project data files across various formats—such as Revit, Tekla, Inventor, Rhino, and IFC—into a unified master file.",
      "Upgraded Appearance Profiler: Enhances visual readability with on-demand profile refreshing, explicit rule order manipulation, and immediate element counter-feedback.",
      "4D/5D Simulation & Pricing Validation: Seamlessly maps 3D geometries directly to construction time schedules and material costs to run full visual construction sequences.",
      "Connected Cloud Data Exchanges: Eliminates file-based export constraints by synchronizing live subsets and design revisions incrementally via Autodesk Construction Cloud.",
    ],
    whatsIncluded: [
      ["Navisworks Manage 2027 Core", "Full-scale desktop coordination application with the proprietary Clash Detective toolset.", "Electronic Download (ELD)"],
      ["Navisworks Simulate 2027", "Companion desktop environment configured for timelines, model animations, and full quantification.", "Electronic Download (ELD)"],
      ["Navisworks Freedom 2027", "Free client-side presentation file viewer optimized to open compiled .NWD project packages.", "Digital Access"],
      ["Autodesk Cloud Plug-ins", "Native Data Exchange Connectors built to map information paths across Revit and Navisworks.", "Integrated Cloud Tools"],
      ["Standard Autodesk Support", "Dedicated 1-on-1 online customer support ticketing and self-help technical documentation forums.", "Digital Account Portal"],
    ],
    subscriptionLicensing: [
      "Commercial New Selection: Installs an entirely new user workspace to extend your company's existing clash testing capabilities and active drafting personnel headcount.",
      "Renewal Subscription Configuration: Extends current operational licenses natively, ensuring that your teams maintain ongoing service access without disrupting linked cloud data paths.",
      "Named Single-User License: Ties software activation parameters strictly to an assigned employee's Autodesk ID profile via the online account portal.",
      "Standard Subscription Tiers: Available for procurement or structural renewal on either an Annual (12-Month) or fixed-rate 3-Year schedule.",
    ],
  }),

  revit: buildProductContent({
    overview:
      "Autodesk Revit® 2027 is the leading multidisciplinary Building Information Modeling (BIM) software tailored for architects, structural engineers, MEP professionals, and construction contractors. This product offering includes options for a brand-new seat (Commercial New) or a seamless extension of an existing seat (Renewal Subscription). Delivered digitally via Electronic License Delivery (ELD), the 2027 edition embeds conversational AI capabilities, unlocks built-in cloud workflows through the Autodesk Forma platform, and significantly modernizes performance metrics for large, complex project files.",
    keyFeatures: [
      "Autodesk Assistant (AI-Powered): Integrates conversational AI directly into the platform to automate model queries, parameter changes, and routine production workflows via natural language.",
      "Forma Connected Client Hub: Subscriptions natively include Autodesk Forma services like Site Design, Building Design, and environmental analyses without needing standalone file conversions.",
      "Rule-Based Element Numbering: Automatically standardizes and sequences rooms, doors, hardware, and structural elements using smart parametric rules and partitions.",
      "Advanced Graphics Pipeline: Transitions out of technical preview to deliver zero-latency GPU-driven updates for live section boxes, model walkthroughs, and complex linked file displays.",
      "Next-Gen Rebar Detailings: Introduces 3D path shape distribution and longitudinal bar placements driven dynamically by transverse rebar geometries.",
    ],
    whatsIncluded: [
      ["Revit 2027 Core Engine", "Comprehensive desktop modeling suite covering Architecture, Structure, and MEP.", "Electronic Download (ELD)"],
      ["Forma Cloud Utilities", "Includes Forma Data Management Essentials, Site/Building Design modules, and Forma Board.", "Integrated Cloud Access"],
      ["Revit Public MCP Server", "Open Model Context Protocol allowing connection to custom, external AI plugins.", "Digital Setup Panel"],
      ["Autodesk Support Network", "1-on-1 priority tech assistance and cloud ticket resolution with Autodesk specialists.", "Digital Account Portal"],
      ["Insight Sustainability Dashboards", "Embodied carbon parameter trackers and shared multi-user environmental analysis metrics.", "Cloud Workspace"],
    ],
    subscriptionLicensing: [
      "Commercial New: Select this configuration if you are introducing a brand-new seat to your design team or expanding your firm's immediate CAD/BIM operational headcount.",
      "Renewal Subscription: Select this option to extend access to your current active contract, preventing service disruptions while grandfathering existing project account assignments.",
      "Licensing Architecture: Assigned as a Single-User Named License managed entirely via the cloud-native Autodesk Account Portal.",
      "Duration Frameworks: Available to procure or renew in Annual (12-Month) or cost-stabilized 3-Year (36-Month) commitments depending on procurement budgets.",
    ],
  }),
};

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

export function getProductDetailContent(productName: string): ProductDetailContent | null {
  return CONTENT[normalizeName(productName)] ?? null;
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}

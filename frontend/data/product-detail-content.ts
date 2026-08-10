/**
 * Portal product detail tab content (Overview / Features / Specifications).
 * Generated from the three product detailing documents in docx-tmp/.
 * Do not hand-edit product copy — re-run:
 *   node frontend/scripts/generate-product-detail-content.mjs
 */

export type ProductDetailBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type ProductDetailContent = {
  overview: ProductDetailBlock[];
  features: ProductDetailBlock[];
  specifications: ProductDetailBlock[];
};

const CONTENT: Record<string, ProductDetailContent> = {
  "3ds max": {
    overview: [
      { type: "p", text: "Autodesk 3ds Max delivers a powerful, flexible toolset to create massive worlds, high-fidelity game assets, and premium product visualizations. Its robust modeling pipeline allows artists to quickly shape, texturize, and light complex scenes. Built-in automation and Python integration let you scale production workflows effortlessly, while the legendary Arnold renderer provides production-ready, physically accurate previews straight out of the box." },
    ],
    features: [
      { type: "ul", items: [
        "Advanced Polygon Modeling: Build intricate 3D environments, organic characters, and hard-surface props with powerful parametric tools.",
        "Built-in Arnold Renderer: Generate photorealistic visual effects, high-fidelity graphics, and complex lighting simulations in real time.",
        "Automated Asset Pipelines: Streamline repetitive studio tasks using built-in scripting tools and comprehensive Python 3 support.",
        "Dynamic FX & Physics: Simulate realistic fire, water, smoke, and cloth using integrated Bifrost and particle systems.",
        "Smart Retopology Tools: Optimize dense, high-polygon CAD geometry into clean, production-ready meshes with a single click.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["3ds Max Core Software", "Desktop application for modeling, texturing, animation, and FX.", "Local Installation"],
        ["Arnold Render Engine", "Integrated interactive rendering engine for photorealistic outputs.", "Local Plugin"],
        ["Autodesk Desktop App", "Central hub for software updates, plugin management, and hotfixes.", "Background Utility"],
        ["Cloud Storage & Collaboration", "Shared views and cloud storage access for remote client reviews.", "Cloud Hosted"],
        ["Technical Support", "24/7 access to Autodesk experts, live chats, and documentation.", "Online Support"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Standard Commercial: Full commercial rights. No revenue caps. Available on flexible monthly or annual terms.",
        "3ds Max Indie: Full commercial rights. For freelancers and startups. Restricted to users below the regional revenue cap.",
        "Autodesk Flex: Pay-as-you-go token system. Best for occasional users. Deducts tokens only on the days you use it.",
      ] },
    ],
  },
  "adobe acrobat pro": {
    overview: [
      { type: "p", text: "Adobe Acrobat Pro for Teams is the industry-standard PDF and e-signature productivity platform built to simplify secure, collaborative document workflows. This specific deployment variant provides complete cross-platform compatibility across multiple operating systems, natively supporting English alongside over 20 additional European languages. Managed via a centralized cloud dashboard, it equips distributed workforces with the premium tools necessary to create, edit, protect, and legally sign documentation simultaneously from any desktop or mobile device." },
    ],
    features: [
      { type: "ul", items: [
        "Centralized Team Administration: Reassign, track, and deploy user seats dynamically across the department via the web-based Adobe Admin Console.",
        "Native Multi-Language Support: Work seamlessly in preferred regional formats, fully supporting Multi European Languages (such as French, German, Spanish, and Italian).",
        "Advanced PDF Editing: Modify text and images, reorder layouts, split large documents, and convert PDFs directly to editable Microsoft Office formats.",
        "Integrated Adobe Acrobat Sign: Send, track, and collect legally binding electronic signatures with real-time status notifications.",
        "Real-Time Group Reviews: Gather team-wide feedback inside a single shared PDF file with live commenting and interactive annotations.",
        "Enterprise-Grade Protection: Safely redact sensitive information, restrict printing permissions, and apply strong password encryption.",
        "Mobile Productivity: Scan paper documents, fill out complex digital forms, and sign files on the go using the Adobe Acrobat Reader app.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Acrobat Pro Desktop Software", "Premium installation package optimized for native desktop performance.", "Windows & macOS"],
        ["Acrobat Mobile Apps", "Comprehensive access to premium features on portable devices.", "iOS & Android"],
        ["Adobe Admin Console", "Central IT console to provision user seats and monitor license compliance.", "Cloud-Based"],
        ["Advanced E-Signatures", "Premium tools to request, track, and legally authenticate signature assets.", "Standard Component"],
        ["Adobe Cloud Storage", "Dedicated cloud space per user seat to support real-time cross-device document syncing.", "Included"],
        ["Acrobat Web Services", "Access to full PDF creation, conversion, and compression tools via internet browsers.", "Included"],
        ["Continuous Updates", "Immediate, automatic access to newly released features, bug fixes, and security patches.", "Included"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual team member's corporate Adobe ID.",
        "Multi-Device Installation: A named user can install and log into Acrobat Pro on up to two separate computers (e.g., office workstation and home laptop).",
        "Single Concurrent Session: The software can only be actively used on one device at any given time per license.",
        "Adobe Value Incentive Plan (VIP): Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date",
      ] },
    ],
  },
  "adobe premiere pro": {
    overview: [
      { type: "p", text: "Adobe Premiere Pro for Teams is the industry-leading, timeline-based video editing software designed for professional production teams, marketing departments, and content creators. This specific commercial deployment variant offers full cross-platform compatibility across both Windows and macOS, natively supporting English alongside over 20 European languages. Managed via a centralized cloud administrative interface, it equips video editors with premium tools for high-performance editing, color grading, motion graphics, and audio mixing, while facilitating real-time collaboration with other team members." },
    ],
    features: [
      { type: "ul", items: [
        "Centralized Team Administration: Assign, reallocate, and track user seats dynamically across your production team using the web-based Adobe Admin Console.",
        "Native Multi-Language Support: Work seamlessly in preferred regional formats, with extensive support for Multi European Languages (such as French, German, Spanish, Italian, and Dutch).",
        "Frame.io for Creative Collaboration: Accelerate review cycles with integrated real-time video review, frame-accurate commenting, and cloud-based media sharing tools.",
        "AI-Powered Adobe Sensei Tools: Save time on tedious tasks with features like Text-Based Editing, Auto Reframe for social media formats, Speech-to-Text captions, and Audio Enhancements.",
        "Comprehensive Color & Audio: Master footage directly on the timeline using advanced Lumetri Color scopes and professional audio engineering tools via the Essential Sound panel.",
        "Native Format Support: Edit everything from mobile footage to 8K, HDR, and virtual reality content without needing time-consuming external transcoding or conversion steps.",
        "Dynamic Link Integration: Eliminate rendering lag by jumping seamlessly between Premiere Pro and Adobe After Effects or Adobe Audition without intermediate rendering.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Premiere Pro Desktop Software", "High-performance video editing software optimized for local system acceleration.", "Windows & macOS"],
        ["Adobe Admin Console", "Central IT dashboard used to provision user seats, monitor license compliance, and manage security settings.", "Cloud-Based"],
        ["Frame.io Integration", "Cloud video review platform including 100GB of shared storage and secure collaborator links.", "Standard Component"],
        ["Adobe Fonts & Stock Audio", "Direct access to thousands of curated premium fonts and royalty-free audio tracks inside the app interface.", "Included"],
        ["Adobe Cloud Storage", "Dedicated, high-speed storage allocated per seat to support smooth cloud assets syncing.", "Included"],
        ["Premiere Rush Mobile App", "Lightweight companion video editor for shooting, editing, and sharing clips on mobile platforms.", "iOS & Android"],
        ["Continuous Updates", "Immediate, automatic access to newly released workflow innovations, performance improvements, and device drivers.", "Included"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual team member's corporate Adobe ID.",
        "Multi-Device Installation: A named user can install and log into Premiere Pro on up to two separate computers (e.g., office workstation and home editing laptop).",
        "Single Concurrent Session: The software can only be actively used on one device at any given time per license.",
        "Adobe Value Incentive Plan (VIP): Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date.",
      ] },
    ],
  },
  "aec collection": {
    overview: [
      { type: "p", text: "The Autodesk AEC Collection Commercial is an all-in-one software ecosystem combining flagship CAD, 3D modeling, and cloud-connected BIM tools. It equips architecture, engineering, and construction teams with everything needed to transition projects from concept to final construction seamlessly." },
    ],
    features: [
      { type: "ul", items: [
        "Multi-Discipline BIM: Design, model, and document buildings with intelligent parametric tools for architecture, structure, and MEP.",
        "Precision Specialized CAD: Access standard drafting alongside vertical toolsets tailored for architecture, electrical, and mechanical design.",
        "Infrastructure & Civil Design: Streamline site layouts, corridor modeling, grading, and transportation design with automated tools.",
        "Pre-Construction Clash Detection: Combine trades into a single model to run interference checks and simulate construction schedules.",
        "Unified Cloud Environment: Securely manage, track, and share project documents across a centralized platform to minimize field errors.",
        "Reality Capture & Rendering: Convert laser scans into 3D models and generate cinematic renderings for client approvals.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Software / Service", "Primary Industry Application"], rows: [
        ["Revit", "Multidisciplinary BIM (Architecture, Structure, MEP)"],
        ["AutoCAD", "Industry-standard 2D/3D drafting and specialized toolsets"],
        ["Civil 3D", "Civil engineering infrastructure design and site layout"],
        ["Navisworks Manage", "Project coordination, 3D clash detection, and simulation"],
        ["Autodesk Docs", "Cloud-based common data environment (CDE)"],
        ["Infraworks", "Conceptual civil infrastructure design and city modeling"],
        ["3ds Max", "3D modeling, animation, and photorealistic rendering"],
        ["Advance Steel", "Structural steel detailing and fabrication modeling"],
        ["Robot Structural Analysis Professional", "Advanced structural load analysis and code compliance"],
        ["ReCap Pro", "Laser scan and reality capture data processing"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "p", text: "License Tier" },
      { type: "ul", items: [
        "Commercial Use: Fully compliant for businesses, corporate enterprises, independent contractors, and government agencies (excludes educational use).",
        "Single-User Access: Assigned directly to a specific user via their email address (Autodesk ID).",
        "Cloud-Managed: Users can log in and download the software on multiple machines, but only one active session can run at any given time.",
        "Electronic License Delivery (ELD): Fully digital distribution. Licenses are provisioned directly to your organization’s Autodesk Account portal for immediate deployment.",
      ] },
    ],
  },
  "autocad": {
    overview: [
      { type: "p", text: "Design the world around you with the industry-standard CAD software trusted by millions. Autodesk AutoCAD with Specialized Toolsets gives you access to seven discipline-specific toolsets—including Architecture, Mechanical, and Electrical—driving an average productivity gain of up to 63%. This AD Commercial package delivers an unrestricted, fully compliant commercial license tailored for business owners, enterprise engineering teams, and freelance professionals." },
    ],
    features: [
      { type: "ul", items: [
        "All-In-One Power: Get standard AutoCAD alongside 7 distinct engineering toolsets under a single subscription.",
        "Massive Symbol Libraries: Instantly unlock over 750,000 intelligent parts, symbols, and components.",
        "Work Anywhere: Seamlessly sync across desktop, web browsers, and mobile devices via AutoCAD Web.",
        "Smart Automation: Speed up tracking with AI-driven object placement, smart text replacement, and automated revision comparisons.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "p", text: "The toolsets run as individual, highly optimized applications tailored to your specific workflow needs:" },
      { type: "table", headers: ["Toolset Name", "Core Focus & Features", "Included Asset Count"], rows: [
        ["Architecture", "Automates floor plans, elevations, sections, and ceiling grids using smart walls, doors, and windows.", "8,000+ Intelligent Objects"],
        ["Mechanical", "Accelerates product design with intelligent manufacturing machinery parts and automated bills of materials (BOM).", "700,000+ Parts & Symbols"],
        ["Electrical", "Streamlines control systems, schematic drawings, panel layouts, and wire tagging to international standards.", "65,000+ Electrical Symbols"],
        ["MEP", "Purpose-built design for Mechanical, Electrical, and Plumbing engineering (HVAC ductwork, piping, circuits).", "10,500+ Intelligent Objects"],
        ["Plant 3D", "Generates process plant layouts, 3D piping routing, and smart Piping and Instrumentation Diagrams (P&IDs).", "Dynamic Spec-driven Piping"],
        ["Map 3D", "Integrates Geographic Information System (GIS) models and geospatial topology to bridge engineering and mapping data.", "Direct GIS Data Connectors"],
        ["Raster Design", "Converts scanned paper blueprints, legacy sketches, or bitmaps directly into clean, editable vector lines.", "Raster-to-Vector Engine"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "License Class: AD Commercial (Valid for commercial business production and enterprise workflows).",
        "Delivery Method: ELD (Electronic License Delivery). Software downloads securely from your digital Autodesk Account. No physical box is shipped.",
        "Seat Type: Single-user Named License. Assigned securely via email to an individual team member.",
        "Version Access: Grants full rights to the latest version plus administrative rollback access to the 3 previous legacy versions",
      ] },
    ],
  },
  "autocad lt": {
    overview: [
      { type: "p", text: "AutoCAD LT Commercial is the industry-leading 2D computer-aided design (CAD) software trusted by millions of architects, engineers, and construction professionals worldwide. Engineered specifically for precision drafting, this commercial version grants full legal rights for use in for-profit projects, client deliverables, and professional environments. It delivers a streamlined, cost-effective toolset focused entirely on 2D design, allowing you to generate documentation faster and collaborate seamlessly across teams without paying for unused 3D features." },
    ],
    features: [
      { type: "ul", items: [
        "Precision 2D Drafting & Documentation: Create precise technical drawings with intuitive editing, shaping, and annotation tools.",
        "Smart Blocks & Automation: Automate repetitive counting tasks and find/replace blocks quickly across your entire canvas.",
        "AutoCAD Web and Mobile Apps: View, edit, share, and co-author drawings on the go from any browser or mobile device.",
        "DWG™ History & Compare: See past versions of your drawing side-by-side to track changes, edits, and evolutionary progress.",
        "Trace & Share Ecosystem: Review drawings safely and add feedback directly to a DWG file without altering the existing blueprint.",
        "Cross-Platform Compatibility: Work flawlessly with native support optimized for both Windows and macOS systems.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["AutoCAD LT Core Software", "Full commercial access to the 2D CAD engine.", "Electronic Software Download (ESD)"],
        ["AutoCAD Web App", "Browser-based CAD tool for on-the-fly edits.", "Cloud-Based Access via Web Browser"],
        ["AutoCAD Mobile App", "iOS and Android companion app for job-site viewing.", "App Store / Google Play Download"],
        ["Autodesk Cloud Storage", "Secure cloud space for file syncing and backup.", "Integrated Autodesk Account Storage"],
        ["Technical Support", "Direct access to Autodesk support experts.", "Online Ticket, Chat, and Scheduled Call"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "p", text: "Autodesk software is licensed strictly via a Named User Subscription Model. Licenses are tied directly to an individual's Autodesk Account, allowing the user to sign in and activate the software on multiple machines (though it can only be actively used on one device at a time)." },
    ],
  },
  "autodesk build": {
    overview: [
      { type: "p", text: "Autodesk Build bridges the gap between design and jobsite execution by centralizing communication, data collection, and document tracking. Built on a common data environment, it allows teams to manage day-to-day operations seamlessly from any device. It combines the best of PlanGrid and BIM 360 to deliver standardized forms, real-time quality tracking, and comprehensive cost insights, ensuring your projects finish on time and under budget." },
    ],
    features: [
      { type: "ul", items: [
        "Connected Project Management: Streamline submittals, RFIs, meeting minutes, and daily logs in one shared digital dashboard.",
        "Real-Time Field Collaboration: Access up-to-date 2D sheets and 3D BIM data directly on-site via mobile devices.",
        "Integrated Cost Control: Track change orders, monitor budgets, and forecast risks dynamically to safeguard profitability.",
        "Quality & Safety Tracking: Standardize safety checklists, log punch lists, and track real-time resolution of field issues.",
        "Predictive Insights & Reports: Leverage machine learning analytics to identify project risks before they stall construction.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Build Core Module", "Cloud tools for RFIs, submittals, schedules, and daily construction workflows.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system providing a single source of project truth.", "Cloud Platform"],
        ["Cost Management Extension", "Tools to manage cash flow, budgets, contracts, and financial change orders.", "Integrated Utility"],
        ["PlanGrid Mobile App", "Mobile field execution app optimized for fast sheet viewing and offline sync.", "iOS / Android App"],
        ["Insight & Administration", "Central dashboard for member permissions, custom templates, and cross-project reports.", "Cloud Analytics"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Build 550 Sheet Plan (Commercial): Full commercial rights. Grants access to up to 550 active sheets across all active projects. Best for small-to-medium project teams.",
        "Flexible Term Contracts: Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Bring Your Own Subscription (BYOS): Allows contractors and external vendors to bring their own Build 550 license into a client's hub without utilizing extra host seat allocations.",
      ] },
    ],
  },
  "autodesk docs": {
    overview: [
      { type: "p", text: "Autodesk Docs serves as the foundation for the Autodesk Construction Cloud platform, providing a secure, centralized repository for all project data. It eliminates communication silos by allowing teams to review, markup, and approve 2D drawings, 3D models, and standard office documents from any device. Built-in permission controls, version histories, and automated approval workflows ensure that field teams, architects, and owners always collaborate on the correct, most up-to-date information." },
    ],
    features: [
      { type: "ul", items: [
        "Common Data Environment: Centralize all construction files, structural designs, and contracts in a single, secure cloud hub.",
        "Advanced 2D/3D Viewer: Preview, pan, zoom, and inspect complex CAD drawings and BIM models directly within your web browser.",
        "Markup & Issue Tracking: Layer public or private comments, callouts, and issue pins onto sheets to accelerate clash resolutions.",
        "Automated Approval Workflows: Streamline document review cycles with customized multi-step routing, electronic sign-offs, and status tracking.",
        "Complete Version Control: Retain a permanent history of document revisions with side-by-side visual comparisons to spot design changes instantly.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Docs Hub", "Cloud platform for advanced file storage, custom folder structures, and attribute tagging.", "Cloud Platform"],
        ["BIM 360 Document Management", "Companion access to legacy BIM 360 environments for older, active project architectures.", "Cloud Platform"],
        ["Autodesk Desktop Connector", "Background utility that syncs your local desktop file explorer directly to cloud project folders.", "Desktop Utility"],
        ["Mobile Access App", "On-the-go sheet viewing, issue tracking, and offline file synchronization for jobsite use.", "iOS / Android App"],
        ["Admin & Security Tools", "Rigorous role-based, company-based, and user-based folder access permission dashboards.", "Cloud Analytics"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Single-User Commercial License: Full commercial rights. Grants one dedicated user full cloud access to manage, view, and collaborate on project documents.",
        "Flexible Term Contracts: Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Bring Your Own Subscription (BYOS): Allows consultants, clients, or subcontractors to bring their own Docs license into a project hub without using the host company's available seat inventory.",
      ] },
    ],
  },
  "autodesk takeoff": {
    overview: [
      { type: "p", text: "Autodesk Takeoff streamlines the estimating process by allowing teams to capture project scopes using both 2D drawings and 3D models. Operating within a shared common data environment, it eliminates data silos and ensures that estimators always work off the latest design revision. By automating quantity calculations and linking takeoffs directly to construction documents, it reduces human error, cuts down on rework, and dramatically accelerates the bidding cycle." },
    ],
    features: [
      { type: "ul", items: [
        "Cloud-Based Quantification: Access and perform takeoffs anytime, anywhere, eliminating the need for bulky local software installations.",
        "Integrated 2D and 3D Takeoffs: Combine linear, count, and area takeoffs from PDF sheets with automated multi-dimensional takeoffs from 3D models.",
        "Custom Classification Systems: Upload and map your standard corporate or regional costing catalogs directly to your quantities.",
        "Real-Time Collaboration: Allow multiple estimators to work simultaneously on a single project package without risking duplicated counts.",
        "Automated Version Tracking: Receive immediate alerts when design files change, allowing you to instantly view and adjust impacted quantities.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Takeoff Module", "Unified workspace for 2D sheet takeoff and 3D model-based quantification.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system ensuring access to the latest construction documents.", "Cloud Platform"],
        ["Formula Engine Tool", "Tool for creating custom mathematical formulas to automate complex component calculations.", "Integrated Utility"],
        ["Takeoff Viewer & Panel", "Responsive browser-based interface for filtering, auditing, and sorting itemized takeoff outputs.", "Web Browser"],
        ["Insight & Analytics", "Central dashboard for visual reporting, data export, and permission management.", "Cloud Analytics"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Standard Commercial License: Full commercial rights. Grants unrestricted access to both 2D and 3D cloud takeoff workflows for professional estimations.",
        "Flexible Term Contracts: Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Bring Your Own Subscription (BYOS): Allows external estimators or trade partners to bring their own Takeoff license into a master project hub without drawing down host seat pools.",
      ] },
    ],
  },
  "bim collaborate pro": {
    overview: [
      { type: "p", text: "( 10, 25,50,100,500,1000)" },
    ],
    features: [],
    specifications: [
      { type: "h3", text: "BIM Collaborate CLOUD Commercial ( Single,10,25,100,500,1000) ( 1 year , 3 year ) ( New , renewal)" },
      { type: "p", text: "Autodesk BIM Collaborate allows project teams to share design data, track progress, and coordinate models in a shared common data environment. Operating entirely in the cloud, it helps teams catch design errors and constructability issues early in the preconstruction lifecycle. It aggregates design models from Revit, Civil 3D, and AutoCAD into a single view, automating spatial coordination and providing actionable insights to eliminate costly on-site reworks and communication delays." },
      { type: "ul", items: [
        "Automated Clash Detection: Aggregate multi-discipline models into shared coordination spaces to instantly spot spatial conflicts.",
        "Visual Change Analysis: Compare design changes between 3D model iterations side-by-side to understand project impacts instantly.",
        "Unified Issue Tracking: Create, assign, and track design issues to resolution using pinned locations directly on 2D sheets and 3D models.",
        "Design Timeline & Packages: Control how and when design data is shared with other project teams using formal packaging and tracking streams.",
        "Connected Navisworks Workflow: Sync cloud-based issue tracking directly with Navisworks Manage for advanced coordination and deeper field analysis.",
      ] },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["BIM Collaborate Module", "Cloud platform for automated model coordination, clash spaces, and matrix reviews.", "Cloud Platform"],
        ["Design Collaboration Module", "Timeline workspace for managing package handoffs and visual project updates.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management foundation ensuring access to the latest source drawings.", "Cloud Platform"],
        ["BIM 360 Workspace", "Legacy access to older project hubs hosted on the previous BIM 360 platform.", "Cloud Platform"],
        ["Coordination Utilities", "Desktop Connector integration and browser-based 3D multi-model aggregation tools.", "Cloud & Desktop"],
      ] },
      { type: "ul", items: [
        "Standard Commercial License: Full commercial rights. Grants a single user cloud access to automated clash matrices, change reviews, and issue tracking.",
        "Flexible Term Contracts: Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Bring Your Own Subscription (BYOS): Allows external consultants, structural engineers, or contractors to bring their own license into a client's hub without utilizing extra host seat allocations.",
      ] },
    ],
  },
  "civil 3d": {
    overview: [
      { type: "p", text: "Autodesk Civil 3D is the premier 3D software for civil infrastructure, site grading, and land surveying. Its intelligent, dynamic modeling automatically updates your entire design—from surfaces to utility networks—the moment changes are made. A commercial subscription gives engineering teams the automated tools and legal rights to optimize workflows, calculate earthworks, and deliver project sheets faster." },
    ],
    features: [
      { type: "p", text: "Group the technical features into highly visible benefits for the end-user" },
      { type: "ul", items: [
        "Corridor & Road Modeling: Build intelligent, 3D dynamic models for highways, transit tracks, and local roads.",
        "Dynamic Site Grading: Automate complex grading designs for commercial lots, ponds, and surfaces while keeping volume tracking live.",
        "Pipe & Pressure Networks: Draft and analyze gravity-fed and pressurized utility systems, complete with depth checks and interference analysis.",
        "Automated Sheet Production: Instantly generate scaled construction plans, profiles, and cross-section sheets.",
        "Earthworks & Material Takeoffs: Run precise cut-and-fill calculations to output Quantity Take-Off (QTO) reports for strict project budgeting",
      ] },
    ],
    specifications: [
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Access Type: 100% digital deployment and delivery managed via the online Autodesk Portal Account.",
        "Subscription Tiers: Flexible procurement available in 1-year or 3-year commercial plans.",
        "Commercial Rights: Grants authorized business use for commercial, profit-generating operations.",
        "Collaboration Add-ons: Cloud-hosted multi-user options via the Autodesk Construction Cloud (ACC) and BIM Collaborate Pro. [1]",
      ] },
    ],
  },
  "infodrainage": {
    overview: [
      { type: "p", text: "Accelerate your sustainable stormwater design workflow and streamline regulatory approvals from day one. The InfoDrainage Commercial Master Bundle is a production-ready model template and asset library engineered specifically for multi-story corporate, retail, industrial, and mixed-use land development projects. It eliminates hours of repetitive drainage setup, bringing immediate Autodesk InfoDrainage standardization and sustainable design compliance to your civil engineering practice. [1, 2]" },
    ],
    features: [
      { type: "ul", items: [
        "Advanced BIM & Civil 3D Integration: Seamless round-tripping structures and surface data with Civil 3D to eliminate manual entry errors.",
        "Pre-Configured Regional Deluge Templates: Built-in rainfall curves and Huff distribution distributions tailored to regional commercial standards. [1]",
        "SuDS & LID Component Templates: Instantly size parametric rain gardens, bioretention cells, permeable pavements, and infiltration trenches.",
        "Automated Hydraulic Sizing Wizards: Smart algorithms optimize pipe sizes, pipe gradients, and online storage structures to prevent site flooding.",
        "Compliance Report Generation: Pre-formatted layout reports mapped to regulatory agency requirements for instant print-to-PDF submission. [1]",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Model Template", "1x Master Commercial Template with pre-set runoff methods, routing criteria, and boundary conditions", ".iddx (InfoDrainage 2024–2026+)"],
        ["SuDS & Structure Library", "50+ Custom inlet/outlet structures, proprietary stormwater filters, weir structures, and smart orifices", ".idlx (Fully Parametric)"],
        ["Rainfall & Deluge Data", "Global NOAA Atlas 14, NRCS, and standard synthetic storm profiles pre-loaded into the rainfall manager", "Pre-built in template"],
        ["Analysis Smart Reports", "5x Regulatory compliance reporting layouts covering pipe audits, hydraulic grade lines, and critical storm paths", "Pre-loaded"],
        ["Implementation Manual", "35-page digital implementation guide covering catchments, utility collision checks, and Civil 3D workflows", ".pdf Digital Download"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Single-User License: 1 user, up to 2 active workstations, and 12 months of free version updates for freelance civil engineers.",
        "Team Design License: Up to 10 users, shared network library deployment, 24 months of updates, and priority technical support.",
        "Enterprise License: Unlimited users across a corporate domain, floating network licensing, lifetime updates, and custom API onboarding",
      ] },
    ],
  },
  "infowater pro": {
    overview: [
      { type: "p", text: "Autodesk InfoWater Pro is a GIS-native desktop hydraulic modeling software that runs directly inside Esri ArcGIS Pro. Built for water utility engineers and consulting firms, it delivers a one-to-one data alignment between geographic information system (GIS) layers and the hydraulic model. The software leverages the industry-standard EPANET engine to simulate countless \"what-if\" scenarios. This allows operators to accurately plan, design, and manage resilient water distribution networks without maintaining separate, detached modeling databases." },
    ],
    features: [
      { type: "ul", items: [
        "ArcGIS Pro Integration: Build, edit, and analyze hydraulic networks within a single geospatial environment.",
        "Criticality Assessment: Identify vulnerable valves and pipe segments to quickly assess isolation and failure impacts.",
        "Advanced Water Quality: Track water age, source tracing, and multi-species chemical interactions dynamically.",
        "Unidirectional Flushing (UDF): Optimize system cleaning plans by simulating the necessary valve closures and target velocities.",
        "Transient Analysis: Simulate pressure surges and water hammer effects to shield physical infrastructure from ruptures.",
        "Automated Demand Allocation: Extract customer consumption from meter data or polygons directly onto network nodes.",
        "ArcGIS Online Publishing: Share live model insights, 3D visualizations, and interactive maps seamlessly with external stakeholders.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWater Pro Core Engine", "Full access to hydraulic and water quality modeling tools inside ArcGIS Pro.", "Standard Component"],
        ["Advanced Extensions", "Bundled access to UDF, Multi-Species Analysis, and Pressure Zone Managers.", "Included"],
        ["Info360 Cloud Services", "Access to Info360 Cloud Model Service for advanced cloud-based simulation runs.", "Included"],
        ["Autodesk Web Services", "Cloud-based collaborative storage solutions like Autodesk Drive and Shared Views.", "Included"],
        ["Autodesk Technical Support", "Phone and online web support directly from senior Autodesk support specialists.", "Included"],
        ["Previous Version Access", "Permissions to download and run up to three previous versions of the software.", "Included"],
        ["Esri ArcGIS Pro License", "Required underlying GIS environment platform needed to run the InfoWater interface.", "Not Included (Sold Separately)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Access: Licenses are tied directly to an individual's Autodesk ID rather than a specific machine.",
        "Multi-Device Installation: A assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop).",
        "Single Concurrent Session: The software can only be actively run on one device at any given time per user.",
        "Autodesk Flex Tokens: A pay-as-you-go credit system ideal for occasional users or temporary project contractors.",
        "Daily Token Deduction: Tokens are deducted from a shared company pool only on the days the software is launched.",
      ] },
    ],
  },
  "infoworks icm": {
    overview: [
      { type: "p", text: "Autodesk InfoWorks ICM Standard (officially designated as InfoWorks ICM Sewer in recent versions) is an advanced integrated catchment modeling software optimized for wastewater and sanitary sewer networks. It enables engineering firms and utility operators to build exceptionally fast, accurate, and collaborative hydraulic models of complex subsurface pipe infrastructure. By delivering unlimited 1D modeling capabilities, it serves as a central source of truth for capacity planning, system expansion analysis, and regulatory compliance without requiring a separate geographic information system (GIS) interface." },
    ],
    features: [
      { type: "ul", items: [
        "Unlimited 1D Modeling: Simulate complex sanitary sewer, combined sewer, and riverine networks with zero cap on network nodes.",
        "Dual-Engine Simulation: Run native, highly stable hydraulic computations using either the standard SWMM5 engine or the proprietary, dynamic time-step ICM SIM engine.",
        "Integrated Catchment Hydrology: Leverage over 15 distinct hydrologic routing models to compute domestic flows, infiltration, and rainfall runoff.",
        "Live Database Lifecycle Tracking: Keep an immutable audit trail using a built-in commit history to trace changes, resolve multi-user conflicts, and roll back edits.",
        "Cloud Computing: Push computationally heavy simulations straight to the cloud to significantly increase calculation speed and free up local workstation resources.",
        "Scenario Management: Construct and simulate dozens of concurrent \"what-if\" planning scenarios simultaneously within a unified environment.",
        "Civil 3D Integration: Seamlessly round-trip infrastructure designs between Autodesk Civil 3D and InfoWorks ICM for continuous hydraulic validation.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks ICM Sewer Engine", "Full access to unlimited 1D hydraulic and hydrologic modeling tools.", "Standard Component"],
        ["SWMM5 & ICM SIM Engines", "Native access to industry-standard computational routing solver systems.", "Included"],
        ["Cloud Simulation Services", "Access to Autodesk cloud database hosting and remote calculation nodes.", "Included"],
        ["Autodesk Drive & Storage", "Web-based storage and secure viewer links for remote client presentations.", "Included"],
        ["InfoWorks ICM Free Viewer", "Lightweight companion software allowing non-technical stakeholders to review model results.", "Included"],
        ["Autodesk Technical Support", "Direct web and phone access to advanced Autodesk utility infrastructure specialists.", "Included"],
        ["Full 2D Overland Mesh Expansion", "Complex 2D surface floodplain and overland storm flood tracking.", "Not Included (Requires InfoWorks ICM Ultimate)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Access: Licenses are tied directly to an individual's Autodesk ID rather than a specific machine.",
        "Multi-Device Installation: An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop).",
        "Single Concurrent Session: The software can only be actively run on one device at any given time per user.",
        "Autodesk Flex Tokens: A pay-as-you-go credit system ideal for occasional users or temporary project contractors.",
        "Daily Token Deduction: Tokens are deducted from a shared company pool only on the days the software is launched",
      ] },
      { type: "h3", text: "InfoWorks ICM - Ultimate Commercial (1 year, 3 year) (New, renewal)" },
      { type: "p", text: "Autodesk InfoWorks ICM Ultimate is the premier integrated catchment modeling platform designed for advanced storm, sanitary, and river system simulations. Built for tier-one engineering firms, flood authorities, and major water utilities, it delivers a fully integrated, simultaneous 1D and 2D hydraulic engine. The software allows engineers to accurately model complex subsurface pipe networks alongside overland urban and riverine floodplains within a single, highly collaborative workspace. By utilizing high-performance GPU-accelerated computing, it resolves complex, large-scale flood risk scenarios rapidly and accurately." },
      { type: "ul", items: [
        "Integrated 1D/2D Simulation Engine: Dynamically links subsurface sewer networks (1D) with complex surface topography (2D) to simulate realistic water movement and urban flooding.",
        "GPU-Accelerated 2D Mesh Computations: Leverages local graphics cards or cloud resources to execute millions of surface flow calculations exponentially faster than CPU-only processing.",
        "Flexible 2D Mesh Generation: Creates custom triangular mesh zones with variable resolutions to capture intricate structural details like roads, buildings, and flood defense walls.",
        "Comprehensive River and Floodplain Modeling: Simulates open channels, bridges, culverts, weirs, and complex tidal boundaries alongside stormwater runoff.",
        "Multi-User Master Database Architecture: Enables large, distributed teams to work concurrently on the same regional model with built-in version control and conflict resolution.",
        "Advanced Remote Cloud Simulation: Offloads massive, multi-scenario 2D runs to Autodesk’s cloud servers to instantly free up local engineering workstations.",
        "Automated Spatial Data Import: Directly ingests high-resolution LiDAR data, GIS layers, and CAD files to rapidly build and refresh terrain models.",
      ] },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks ICM Ultimate Engine", "Uncapped access to full 1D pipe modeling and advanced 2D overland flood routing.", "Standard Component"],
        ["GPU-Enabled Solver (ICM SIM)", "Native support for graphics card acceleration to run heavy 2D mesh computations locally.", "Included"],
        ["Cloud Simulation Services", "Uncapped ability to offload high-density 1D and 2D runs to remote Autodesk servers.", "Included"],
        ["InfoWorks ICM Free Viewer", "Complimentary standalone application for clients and reviewers to inspect finished model files.", "Included"],
        ["Autodesk Web Services & Storage", "Cloud database hosting environments paired with shared link generation for project collaboration.", "Included"],
        ["Autodesk Technical Support", "Priority access to senior Autodesk water infrastructure engineers via phone or digital tickets.", "Included"],
        ["Previous Version Rights", "Authorization to download, license, and deploy up to three historical versions of the software.", "Included"],
      ] },
      { type: "ul", items: [
        "Named User Access: Licenses are tied directly to an individual's Autodesk ID rather than a specific machine.",
        "Multi-Device Installation: An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop).",
        "Single Concurrent Session: The software can only be actively run on one device at any given time per user.",
        "Autodesk Flex Tokens: A pay-as-you-go credit system ideal for occasional users or temporary project contractors.",
        "Daily Token Deduction: Tokens are deducted from a shared company pool only on the days the software is launched.",
      ] },
    ],
  },
  "infoworks ws pro": {
    overview: [
      { type: "p", text: "Autodesk InfoWorks WS Pro is an enterprise-level, standalone hydraulic modeling platform built to plan, design, and operate highly accurate clean water distribution networks. Unlike GIS-dependent applications, InfoWorks WS Pro uses a centralized master database architecture that allows large, multi-disciplinary engineering teams to collaborate on the same regional network model simultaneously. It enables utilities to build complex, standalone digital twins, connect directly to live telemetry, and execute heavy multi-core or cloud simulations to evaluate system performance and protect water quality." },
    ],
    features: [
      { type: "ul", items: [
        "Multi-User Collaborative Database: Enables multiple modeling engineers to access and edit the exact same model simultaneously, complete with built-in version control and conflict resolution.",
        "Live Telemetry Integration: Connects directly to external SCADA or telemetry data streams to automate demand area calibrations, assess system leakage, and analyze real-time network behavior.",
        "Advanced Ruby Script Automation: Automates highly repetitive workflows, cleanups, and complex data imports from external systems using a built-in Ruby scripting environment.",
        "Comprehensive System Analytics: Simulates advanced water quality parameters (such as multi-species chlorination decays and water age), fire flow capacities, and unidirectional main flushing programs.",
        "Realistic Operational Modeling: Recreates true-to-life utility operations by explicitly modeling hydrants, localized meters, complex valve curves, and variable-speed pump control policies.",
        "Integrated Surge & Transient Analysis: Simulates pressure surges, pipe bursts, and water hammer events natively to evaluate asset resilience against physical structural failures.",
        "Multi-Scenario EPANET Importer: Ingests multiple third-party .inp network configurations concurrently into a single model folder to rapidly convert legacy data sets into functional operational scenarios.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks WS Pro Client Engine", "Complete workspace access to holistic 1D water distribution network building and analysis tools.", "Standard Component"],
        ["IWLive Pro Integration", "Built-in access to live baseline operational forecasting and real-time pipe burst or isolation tracking.", "Included"],
        ["Cloud Simulation Capabilities", "Ability to run highly scalable, multi-run calculations using remote cloud server computing resources.", "Included"],
        ["InfoWorks WS Pro Free Viewer", "A complimentary desktop app allowing review teams and clients to view simulation data assets without a active license.", "Included"],
        ["Autodesk Web Services & Drive", "Secure cloud-hosted database spaces combined with web link generation for collaborative team design reviews.", "Included"],
        ["Autodesk Technical Support", "Priority ticketing, web assistance, and phone support from Autodesk utility infrastructure specialists.", "Included"],
        ["Historical Version Availability", "Complete access to download, configure, and operate up to three previous release cycles of the core software.", "Included"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Access: Licenses are tied directly to an individual's Autodesk ID rather than a specific machine.",
        "Multi-Device Installation: An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop).",
        "Single Concurrent Session: The software can only be actively run on one device at any given time per user.",
        "Autodesk Flex Tokens: A pay-as-you-go credit system ideal for occasional users or temporary project contractors.",
        "Daily Token Deduction: Tokens are deducted from a shared company pool only on the days the software is launched.",
      ] },
    ],
  },
  "microsoft 365 apps": {
    overview: [
      { type: "p", text: "Microsoft 365 Apps for Business is a premium, desktop-focused productivity suite designed for small to medium-sized businesses that require advanced offline document editing and file storage without cloud-hosted email servers or collaboration platforms. Operating under Microsoft's New Commerce Experience (NCE) framework, it delivers always-updated, locally installable versions of core Office applications paired with secure cloud backup. This subscription serves as a powerful solution for organizations that prefer to handle their business email elsewhere (such as legacy local servers or third-party hosts) but need top-tier processing power and analytical tools on their physical devices." },
    ],
    features: [
      { type: "ul", items: [
        "Premium Desktop Office Suite: Install and run high-performance, offline versions of Word, Excel, PowerPoint, Outlook, and OneNote locally.",
        "Advanced Data Analysis: Leverage full local processing power in Excel to execute complex pivot tables, advanced array formulas, and automated macros.",
        "Expansive Cloud Workspaces: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring advanced file synchronization and remote access.",
        "Non-Destructive Version History: Protect business assets from accidental overwrites or data loss with automated real-time cloud backups and document version restorations.",
        "Professional Layout Creation: Access Microsoft Publisher locally to build custom structural layout templates, marketing flyers, and product packaging drafts (Windows PC only).",
        "Database Management Tools: Utilize Microsoft Access on local workstations to design, configure, and maintain standalone relational business databases (Windows PC only).",
        "Cross-Device Continuity: Open a presentation on your phone, make quick adjustments on a tablet, and finalize the high-fidelity design back on your office desktop workstation.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Office Desktop Apps", "Fully functional local software installations of Word, Excel, PowerPoint, Outlook, and OneNote.", "Windows & macOS"],
        ["OneDrive for Business", "1TB of dedicated cloud storage per user to back up, store, and sync internal corporate assets.", "Standard Component"],
        ["Office for the Web", "Browser-optimized versions of Word, Excel, and PowerPoint for quick on-the-go viewing and light editing.", "Included"],
        ["Office Mobile Applications", "Full suite of core productivity applications optimized for deployment on pocket-sized platforms.", "iOS & Android"],
        ["Windows PC Exclusive Apps", "Local client-bound database creation (Access) and structural marketing material layout (Publisher).", "Windows Desktop Only"],
        ["Business-Class Cloud Email", "Dedicated corporate mail hosting, custom domains, or large 50GB/100GB exchange inboxes.", "Not Included (Excluded)"],
        ["Microsoft Teams App", "Instant messaging channels, enterprise chat panels, and live video conferencing software rooms.", "Not Included (Excluded)"],
        ["SharePoint Online Portal", "Collaborative corporate intranet portals and structured department document libraries.", "Not Included (Excluded)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual user's corporate account identity or work email rather than a specific physical machine.",
        "Multi-Device Deployment: A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms.",
        "NCE Commitment Strictness: Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window.",
        "Strict 300-Seat Cap: This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (Microsoft 365 Apps for Enterprise)",
      ] },
    ],
  },
  "microsoft 365 business": {
    overview: [
      { type: "p", text: "Microsoft 365 Business Standard is the definitive productivity and collaboration suite tailored specifically for small to medium-sized businesses. Operating under Microsoft's New Commerce Experience (NCE) framework, it combines premium, locally installable desktop applications with enterprise-grade cloud communication services. This subscription serves as a unified digital workspace, allowing teams to manage custom business emails, conduct high-capacity virtual meetings, and securely collaborate on shared files from any location or device." },
    ],
    features: [
      { type: "ul", items: [
        "Premium Desktop Office Suite: Install and execute high-performance, offline versions of Word, Excel, PowerPoint, Outlook, and OneNote.",
        "Intelligent Business Email: Establish absolute brand credibility by running custom domain emails (e.g., name@yourcompany.com) powered by an underlying Exchange backend.",
        "Unified Collaboration Hub: Coordinate team operations with Microsoft Teams for high-definition video conferencing, persistent group chat, and shared channel spaces.",
        "Expansive Cloud Workspaces: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring advanced file synchronization and remote access.",
        "Streamlined Client Scheduling: Automate appointment management, client scheduling, and staff calendars using integrated Microsoft Bookings software.",
        "Ethical AI Chat Experience: Leverage Microsoft Copilot with web grounding to access writing assistance, rapid data summaries, and protected information parsing.",
        "Database Management Tools: Access Microsoft Access and Microsoft Publisher locally to build custom structural layout templates and standalone databases (Windows PC only).",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Office Desktop Apps", "Fully functional local software installations of Word, Excel, PowerPoint, Outlook, and OneNote.", "Windows & macOS"],
        ["Microsoft Teams App", "High-capacity virtual meeting rooms holding up to 300 concurrent participants.", "Standard Component"],
        ["Business Class Email Mailbox", "50GB primary mailbox per user paired with integrated shared calendars and malware filtering.", "Included"],
        ["OneDrive for Business", "1TB of dedicated cloud storage per user to back up and sync internal corporate assets.", "Included"],
        ["SharePoint Online (Plan 1)", "Collaborative corporate intranet portals and structured department document libraries.", "Included"],
        ["Operational Business Apps", "Direct access to productivity-driving services like Microsoft Forms, Planner, and Bookings.", "Included"],
        ["Microsoft Intune Device Management", "Advanced enterprise endpoint management, conditional access, and remote device wiping tools.", "Not Included (Requires Business Premium)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual user's corporate identity rather than a specific physical machine.",
        "Multi-Device Deployment: A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms.",
        "NCE Commitment Strictness: Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window.",
        "Strict 300-Seat Cap: This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (E3/E5).",
      ] },
    ],
  },
  "microsoft visio": {
    overview: [
      { type: "p", text: "Microsoft Visio Plan 2 is the premium, cloud-powered diagramming and vector graphics platform engineered for business analysts, IT professionals, and enterprise engineers. This subscription unlocks both the always-updated, full-featured Visio desktop application and the highly accessible Visio for the web interface. Built to transform complex data into clear visual structures, it enables organizations to map out intricate business processes, document network architectures, map databases, and visualize floor plans while collaborating in real time directly within the Microsoft 365 cloud environment. [1, 2, 3, 4, 5]" },
    ],
    features: [
      { type: "ul", items: [
        "Premium Desktop App Access: Install the high-performance Visio client locally to access advanced design layouts, custom rendering tools, and offline editing. [1, 2, 3]",
        "Massive Stencil Library: Choose from over 25,000 specialized shapes and templates, including industry standards like BPMN 2.0, UML 2.5, and IEEE network schematics. [1, 2, 3, 4]",
        "Live Data-Linked Diagramming: Connect shapes directly to real-time data sources (such as Microsoft Excel, SQL Server, or SharePoint) to trigger automated structural and color updates. [1, 2, 3, 4, 5]",
        "Power BI Dashboard Integration: Embed operational Visio diagrams directly inside Power BI reports to create interactive, data-driven operational control panels. [1, 2]",
        "Automated Process Mapping: Generate professional flowcharts automatically from raw Excel data tables using the built-in Data Visualizer engine. [1, 2, 3]",
        "Real-Time Web Collaboration: Review, edit, and co-author complex system architectures simultaneously with team members via any modern web browser. [1, 2, 3, 4, 5]",
        "AutoCAD Drawing Support: Ingest advanced CAD files (up to DWG 2013) to overlay shapes, map facilities, and visualize complex spatial infrastructures seamlessly. [1, 2, 3]",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Visio Desktop Application", "Full production-ready desktop installation package featuring premium stencils and shape customization.", "Windows Desktop Only"],
        ["Visio for the Web", "Light browser-based diagramming environment for immediate, cross-platform editing and viewing.", "Web Browser"],
        ["Advanced Database Mapping", "Built-in reverse engineering tools to generate graphical models from existing SQL or Oracle databases.", "Standard Component"],
        ["Cloud-Based Document Storage", "2GB of dedicated, personal OneDrive storage to securely back up and sync active visual assets.", "Included"],
        ["Microsoft Teams Integration", "Embedded viewer panels allowing teams to share, view, and co-edit diagrams right inside a Teams channel.", "Included"],
        ["Continuous Feature Updates", "Immediate, cloud-delivered access to newly released industry stencils, feature upgrades, and security fixes.", "Included"],
        ["Native macOS Desktop Client", "A fully dedicated, installable local desktop app package designed specifically for Apple hardware.", "Not Included (Use Web App)"],
        ["Core Microsoft 365 Business Apps", "Access to download and run core application suites such as Word, Excel, Outlook, or Teams.", "Not Included (Requires M365 Sub)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine.",
        "Multi-Device Deployment: A single named user seat allows an employee to install and activate the Visio desktop app concurrently on up to five PCs, alongside web browser access.",
        "Central M365 Admin Center: IT administrators can instantly provision, assign, or reallocate active licenses dynamically as corporate personnel needs shift.",
        "Flexible Corporate Purchasing: Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA).",
        "No Maximum Seat Caps: Designed without any user deployment limitations, enabling mid-sized and global enterprise organizations to deploy unlimited seats across their tenant.",
      ] },
    ],
  },
  "navisworks": {
    overview: [
      { type: "p", text: "Autodesk Navisworks Manage allows architecture, engineering, and construction professionals to pre-visualize entire projects before construction begins. It aggregates 3D data from disparate design applications—regardless of file size or format—into a unified project model. By combining automated clash detection, interference checking, time-liner scheduling, and quantification tools, Navisworks Manage helps preconstruction teams anticipate risks, resolve conflicts early, and eliminate expensive structural reworks on the jobsite." },
    ],
    features: [
      { type: "ul", items: [
        "Advanced Clash & Interference Detection: Automatically identify, isolate, and log spatial conflicts between multi-discipline design models before breaking ground.",
        "Unified Model Aggregation: Merge massive 3D models and design files from Revit, Civil 3D, AutoCAD, and non-Autodesk formats into one responsive scene.",
        "4D and 5D Simulation: Link 3D model geometry directly to construction schedules (4D) and cost tracking (5D) to visualize project timelines.",
        "Streamlined Quantification: Perform automated, high-speed material takeoffs from integrated 3D models or combined 2D sheet sets.",
        "Cloud-Connected Issues: Sync clash results dynamically with Autodesk BIM Collaborate to manage and assign field issues within a shared cloud environment.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Navisworks Manage Core", "Desktop application for advanced clash matrix detection, 3D model aggregation, and quantification.", "Local Installation"],
        ["Navisworks Simulate", "Companion tool for scene visualization, 4D/5D time-lining, and animation (without the clash matrix module).", "Local Installation"],
        ["Navisworks Freedom Viewer", "Complimentary distribution utility used to view compiled NWD files with field teams or external clients.", "Free Desktop App"],
        ["File Format Exporters", "Comprehensive plugins to export native CAD/BIM formats into lightweight Navisworks file formats (NWC).", "Integrated Plugins"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, coordination updates, and performance hotfixes.", "Background Utility"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Standard Commercial License: Full commercial rights. Grants unrestricted usage for general contractors, BIM managers, engineering consultants, and commercial developers.",
        "Flexible Term Contracts: Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Autodesk Flex (Pay-As-You-Go): Fully compatible with Autodesk's token system, allowing seasonal coordinators or external trade contractors to consume tokens only on the active days of use.",
      ] },
      { type: "h3", text: "Navisworks Simulate Commercial. (1 year, 3 year) (New, renewal)" },
      { type: "p", text: "Autodesk Navisworks Simulate empowers architecture, engineering, and construction professionals to aggregate 3D data from multiple design applications into a single, lightweight project environment. Built for preconstruction scheduling and review, it helps teams analyze, communicate, and visualize project outcomes before construction begins. By combining scheduling data with 3D models (4D) and material tracking (5D), Navisworks Simulate ensures clear communication among stakeholders, smoother on-site logistics, and accurate material takeoffs." },
      { type: "ul", items: [
        "Unified Model Aggregation: Combine massive 3D models and design files from Revit, Civil 3D, AutoCAD, and non-Autodesk applications into a single, responsive file.",
        "4D Schedule Simulation: Link 3D geometry directly to project schedules (such as Primavera or Microsoft Project) to visually simulate construction timelines",
        "5D Cost Quantification: Perform high-speed material takeoffs and measure distances, areas, and counts from integrated 3D models or 2D sheets.",
        "Photorealistic Rendering & Animation: Generate professional 3D walk-throughs, fly-bys, and photorealistic asset animations to effectively communicate project intent.",
        "Comprehensive Review Tools: Utilize sectioning tools, redlining capabilities, and comment tracking to review design packages with clients and field teams.",
      ] },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Navisworks Simulate Core", "Desktop application for project aggregation, 4D/5D simulation, rendering, and quantification.", "Local Installation"],
        ["Navisworks Freedom Viewer", "Complimentary distribution utility used to share compiled project files (NWD) with external field stakeholders.", "Free Desktop App"],
        ["File Format Exporters", "Comprehensive plugins to export native CAD and BIM formats into lightweight Navisworks files (NWC).", "Integrated Plugins"],
        ["Quantification Workbook", "Integrated utility for managing item catalogs, automated counts, and visual takeoff outputs.", "Local Utility"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, performance patches, and hotfixes.", "Background Utility"],
      ] },
      { type: "ul", items: [
        "Standard Commercial License: Full commercial rights. Grants unrestricted usage for general contractors, scheduling managers, estimators, and project owners.",
        "Flexible Term Contracts: Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms.",
        "Autodesk Flex (Pay-As-You-Go): Fully compatible with Autodesk's token system, allowing seasonal coordinators or external trade contractors to consume tokens only on active days of use.",
      ] },
    ],
  },
  "oracle primavera p6": {
    overview: [
      { type: "p", text: "Oracle Primavera P6 Professional Project Management is the gold standard for heavy-discipline enterprise project management, critical path scheduling, and resource control. This specific commercial licensing variant grants an Application User Perpetual right of use, meaning your organization owns the software license indefinitely without mandatory recurring annual subscription fees. Engineered to handle large-scale, highly complex, and multi-faceted initiatives, it enables project schedulers, control managers, and engineers to orchestrate tens of thousands of activities, balance localized resource pools, and maintain complete structural integrity across global portfolio hierarchies." },
    ],
    features: [
      { type: "ul", items: [
        "Perpetual Asset Ownership: Acquire a permanent right to operate the specific software version version indefinitely, moving software costs from operational expenses (OpEx) to capital expenditures (CapEx).",
        "Massive Scale Scheduling: Build, manage, and calculate critical paths for massive projects containing up to 100,000 active individual activities simultaneously.",
        "Intelligent Critical Path Method (CPM): Execute deep algorithmic forward and backward pass calculations to pinpoint zero-float tasks and accurately forecast project completion dates.",
        "Advanced Resource Levelling: Analyze localized or enterprise-wide labor, equipment, and material allocations to resolve resource over-allocations based on project priority rankings.",
        "Granular Baseline Comparison: Log an unlimited number of targeted baseline snapshots to precisely track structural variances in cost, schedule duration, and resource burn rates over time.",
        "Risk & Threshold Tracking: Establish custom key performance indicators (KPIs) and automated threshold alerts to proactively isolate variance spikes before they impact budgets.",
        "Enterprise ERP Connectivity: Bridge operational engineering schedules seamlessly with corporate financial backbones using optional enterprise data exchange gateways.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Primavera P6 Professional Client", "Full local installation rights to the flagship heavy-client project scheduling engine interface.", "Windows Desktop"],
        ["Perpetual Core Software License", "Indefinite legal right to install and run the core software package without expiration dates.", "Standard Component"],
        ["P6 Optional Client Environment", "Lightweight desktop installation package designed specifically for remote users on lower bandwidth.", "Included"],
        ["SQLite / Local Database Engine", "Self-contained baseline database engine tailored for standalone desktop users or field laptop setups.", "Included"],
        ["Oracle Software Delivery Cloud", "Secure digital access portal to download core installation binaries and software deployment documentation packages.", "Included"],
        ["First Year Technical Support (Oracle Premier)", "First-year 24/7 technical troubleshooting access, patch updates, and system updates.", "Included (1st Year Mandatory)"],
        ["Subsequent Support & Upgrades (Years 2+)", "Optional, ongoing annual software maintenance updates and access to new major releases.", "Not Included (Renewed Annually)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Perpetual Legal Structure: Unlike SaaS or cloud subscriptions, this license never expires or auto-terminates due to non-payment of subscription fees.",
        "Application User Allocation: This metric assigns the perpetual asset to a single, specific named individual authorized to use the software program, regardless of whether they are actively logged in.",
        "Non-Concurrent Restriction: Licenses cannot be pooled, split, or shared concurrently among multiple project managers or departments.",
        "Flexible Database Targets: A single licensed user can choose to point their local workspace toward a standalone local SQLite file or hook into an enterprise Oracle/Microsoft SQL server database.",
        "Oracle Premier Support Alignment: While the software use right is permanent, the access to patch rollouts, feature drops, and the Oracle support desk is maintained via a separate, optional annual renewal fee.",
      ] },
      { type: "h3", text: "Primavera P6 Enterprise Project Portfolio Management - Application User Perpetual" },
      { type: "p", text: "Oracle Primavera P6 Enterprise Project Portfolio Management (EPPM) is a 100% web-based, enterprise-grade project portfolio management solution designed to prioritize, plan, manage, and execute large-scale programs and portfolios. This specific commercial licensing variant grants an Application User Perpetual right of use, giving your organization permanent ownership of the software license without mandatory recurring seat subscription fees. Built on a robust Java architecture and powered by centralized enterprise databases, P6 EPPM enables executive leadership, Project Management Offices (PMOs), and globally distributed teams to collaborate simultaneously on complex, multi-tiered project hierarchies with real-time performance visibility." },
      { type: "ul", items: [
        "Perpetual Asset Ownership: Secure an infinite legal right to operate the software platform version, transitioning software costs into a capital expenditure (CapEx) asset.",
        "100% Web-Based Browser Interface: Access the complete portfolio infrastructure from anywhere through any modern web browser without local desktop client dependencies.",
        "Global Portfolio & EPS Management: Organize cross-regional projects into structured Enterprise Project Structures (EPS) and user-defined portfolios for high-level executive tracking.",
        "Interactive Executive Dashboards: Generate real-time visual scorecards and interactive web dashboards to monitor key performance indicators (KPIs) and project health.",
        "Cross-Project Resource Optimization: Analyze, track, and dynamically level labor, equipment, and material resources across the entire organization's active project ecosystem.",
        "P6 Team Member Web & Mobile Interface: Allow field workers to quickly submit timesheets, update task progress, and log issues using specialized mobile web layouts or native apps.",
        "Integrated Business Intelligence (BI): Utilize native reporting via Oracle BI Publisher to distribute complex, automated enterprise compliance matrices and standard corporate project templates.",
      ] },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["P6 EPPM Web Portal Access", "Complete browser-based interactive module for high-level portfolio oversight, scheduling, and risk monitoring.", "Browser-Based"],
        ["Perpetual Software License", "Indefinite legal right to configure, host, and execute the primary enterprise platform indefinitely.", "Standard Component"],
        ["P6 Professional Client App", "Dual-access installation right allowing advanced power users to connect a heavy desktop client directly to the central database.", "Windows Desktop"],
        ["P6 Team Member Interfaces", "Includes access profiles for P6 Team Member Web, email statusing options, and iPhone tracking app packages.", "iOS / Web / Email"],
        ["Restricted WebLogic & BI Publisher", "Restricted-use licenses for Oracle WebLogic Server and BI Publisher exclusively to support the P6 environment.", "Included (Restricted)"],
        ["Oracle Software Delivery Cloud", "Secure digital deployment hub used to fetch central platform installation binaries and system scripts.", "Included"],
        ["First Year Technical Support (Oracle Premier)", "Mandatory first-year 24/7 technical troubleshooting access, web patches, and major code version updates.", "Included (1st Year Mandatory)"],
        ["Subsequent Support & Upgrades (Years 2+)", "Optional, ongoing annual software maintenance updates and access to new major releases.", "Not Included (Renewed Annually)"],
      ] },
      { type: "ul", items: [
        "Perpetual Legal Structure: Licenses do not expire or automatically terminate, guaranteeing your company operational continuity across its hosted database infrastructure.",
        "Application User Allocation: This metric assigns the perpetual asset to a single, specific named individual authorized to log into the P6 web or desktop software components.",
        "Non-Pool able Licenses: User allocations are strictly tied to specific profiles; licenses cannot be parsed out, shared concurrently, or split into generic floating company seats.",
        "Enterprise Database Requirements: Tailored specifically to point toward centrally hosted IT environments running full-scale Oracle Database installations or Microsoft SQL Server platforms.",
        "Oracle Premier Support Alignment: Access to ongoing software patch deployments, system compatibility hotfixes, and the live Oracle help desk requires an annual support renewal fee.",
      ] },
    ],
  },
  "power bi": {
    overview: [
      { type: "p", text: "Microsoft Power BI Pro is a cloud-based business intelligence platform that equips users with self-service analytics to discover insights, visualize data, and share interactive dashboards across an organization. Built for data analysts, business leads, and corporate decision-makers, it enables secure data modeling, real-time reporting, and collaborative decision-making. Operating natively within the Microsoft 365 cloud environment, this license provides individual users with the necessary infrastructure to publish and distribute dashboards securely, establishing a unified data culture while maintaining rigorous enterprise security standards." },
    ],
    features: [
      { type: "ul", items: [
        "Interactive Data Visualizations: Create dynamic reports utilizing hundreds of modern charts, graphs, map matrices, and custom community visuals.",
        "Multi-Source Data Ingestion: Extract, clean, and model structured or unstructured data seamlessly from over 100 on-premises and cloud-native databases.",
        "Secure Workspace Collaboration: Co-author, manage, and distribute interactive report dashboards with team members inside protected Power BI cloud workspaces.",
        "Automated Data Refreshes: Keep corporate dashboards up to date by scheduling up to 8 automated data refreshes per day for connected datasets.",
        "Native M365 Suite Integration: Embed active, interactive analytics dashboards directly into Microsoft Teams channels, SharePoint portals, or PowerPoint slide decks.",
        "Mobile-Optimized Dashboards: Author custom, responsive report layouts designed specifically for secure viewing and data exploration on portable devices.",
        "Row-Level Security (RLS): Enforce granular data access constraints so users only see specific rows or datasets mapped to their exact organizational permissions.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Power BI Desktop App", "High-performance desktop data modeling and report building application featuring local computation.", "Windows Desktop Only"],
        ["Power BI Cloud Service", "Centralized web portal used to host datasets, configure workspaces, and share interactive dashboards.", "Web Browser"],
        ["Power BI Mobile Applications", "Secure companion applications optimized for real-time mobile dashboard interaction and metric tracking.", "iOS & Android"],
        ["On-Premises Data Gateway", "Secure data pipeline bridge used to link cloud reports directly back to internal local databases.", "Standard Component"],
        ["Data Encryption & Lineage", "Enterprise-grade sensitivity labeling, cloud data encryption, and visual data lineage tracking.", "Included"],
        ["Power Apps & Automate Sync", "Built-in connectors allowing users to trigger automated workflows directly from inside report visuals.", "Included"],
        ["Power BI Premium Capacities", "Uncapped dataset sizes, paginated reports, advanced AI model training, and 48 daily refreshes.", "Not Included (Requires Premium/Fabric)"],
        ["Base Microsoft 365 License", "Underlying office productivity apps like Excel, Outlook, or Teams.", "Not Included (Sold Separately)"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Named User Allocation: Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine.",
        "Two-Way Sharing Requirement: Both the report author and the report recipient must possess a Power BI Pro (or higher) license to securely view and interact with shared content.",
        "Central M365 Admin Center: IT administrators can instantly provision, assign, or reallocate active licenses dynamically as personnel reporting needs shift.",
        "Flexible Standalone or Bundle Purchasing: Available as an individual standalone user add-on, and comes pre-bundled inside premium enterprise suites like Microsoft 365 E5.",
        "No Maximum Seat Caps: Designed to scale flawlessly from small business teams up to massive multi-national corporations, supporting an unlimited number of users.",
      ] },
    ],
  },
  "revit": {
    overview: [
      { type: "p", text: "Autodesk Revit delivers an all-in-one BIM solution that enables design and construction teams to bring high-quality architectural concepts to physical realization. Unlike standard 2D drafting tools, Revit captures a complete digital representation of a building where every wall, pipe, and beam is an intelligent parametric component. This unified database ensures that any structural modification made anywhere in the project instantly updates across all 2D sheets, 3D views, schedules, and sections—eliminating coordination errors, streamlining documentation, and driving smoother on-site execution." },
    ],
    features: [
      { type: "ul", items: [
        "Multidisciplinary BIM Workspace: Access specialized toolsets for architectural design, structural engineering, and mechanical, electrical, and plumbing (MEP) fabrication detailing within a single platform.",
        "Parametric Components: Create intelligent 3D building blocks (Families) that hold physical property parameters, dimensions, and operational data.",
        "Automated Documentation: Generate precise 2D plans, elevations, details, and material schedules that dynamically update in real time as the 3D design changes.",
        "OpenBIM & IFC Support: Collaborate seamlessly across different software applications with native support for international IFC standards and advanced file interoperability.",
        "Integrated Analysis Tools: Run preliminary structural load tests, energy consumption evaluations, and computational fluid dynamics (CFD) workflows directly inside the design model.",
      ] },
    ],
    specifications: [
      { type: "h3", text: "What's Included" },
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Revit Core Software", "Unified desktop application for architectural design, structural engineering, and MEP system modeling.", "Local Installation"],
        ["Parametric Component Library", "Deep database of pre-built doors, windows, steel connections, light fixtures, and duct geometries.", "Local / Network Shared"],
        ["Autodesk Insight Engine", "Cloud-powered analytical tool used to run environmental performance and carbon footprint simulations.", "Integrated Cloud Service"],
        ["Autodesk Docs Interoperability", "Background cloud integration to share 3D models and sync work packages into a common data environment.", "Cloud Platform"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, design hotfixes, and product additions.", "Background Utility"],
      ] },
      { type: "h3", text: "Subscription & Licensing Options" },
      { type: "ul", items: [
        "Single-User License: 1 user, up to 2 active devices, and 12 months of free version updates for solo practitioners.",
        "Team Studio License: Up to 10 users, BIM 360/ACC server deployment, 24 months of updates, and priority email support.",
        "Enterprise License: Unlimited users across a corporate domain, lifetime updates, and a live onboarding session.",
      ] },
    ],
  },
};

function normalizeName(label: string): string {
  return label.trim().toLowerCase();
}

/** Returns document-backed detail content for a catalog product, or null if none. */
export function getProductDetailContent(productName: string): ProductDetailContent | null {
  return CONTENT[normalizeName(productName)] ?? null;
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}

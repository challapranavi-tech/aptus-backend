/** @deprecated PDF extract archive — not imported by the app. See product-detail-content.ts */

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

export const ADOBE_ORIGINAL_DETAIL_SLUGS = new Set([
  "adobe-business-creative-solutions",
  "creative-cloud-teams-education",
  "creative-cloud-enterprise-hed",
  "creative-cloud-enterprise",
  "adobe-acrobat-pro",
  "adobe-illustrator",
  "adobe-photoshop",
  "adobe-premiere-pro",
]);

const CONTENT: Record<string, ProductDetailContent> = {
  "3ds-max": {
    overview: [
      { type: "p", text: "Autodesk 3ds Max delivers a powerful, flexible toolset to create massive worlds, high-fidelity game assets, and premium product visualizations. Its robust modeling pipeline allows artists to quickly shape, texturize, and light complex scenes. Built-in automation and Python integration let you scale production workflows effortlessly, while the legendary Arnold renderer provides production-ready, physically accurate previews straight out of the box." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Advanced Polygon Modeling: Build intricate 3D environments, organic characters, and hard-surface props with powerful parametric tools.",
        "Built-in Arnold Renderer: Generate photorealistic visual effects, high-fidelity graphics, and complex lighting simulations in real time.",
        "Automated Asset Pipelines: Streamline repetitive studio tasks using built-in scripting tools and comprehensive Python 3 support.",
        "Dynamic FX & Physics: Simulate realistic fire, water, smoke, and cloth using integrated Bifrost and particle systems.",
        "Smart Retopology Tools: Optimize dense, high-polygon CAD geometry into clean, production-ready meshes with a single click.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["3ds Max Core Software", "Desktop application for modeling, texturing, animation, and FX.", "Local Installation"],
        ["Arnold Render Engine", "Integrated interactive rendering engine for photorealistic outputs.", "Local Plugin"],
        ["Autodesk Desktop App", "Central hub for software updates, plugin management, and hotfixes.", "Background Utility"],
        ["Cloud Storage & Collaboration", "Shared views and cloud storage access for remote client reviews.", "Cloud Hosted"],
        ["Technical Support", "24/7 access to Autodesk experts, live chats, and documentation.", "Online Support"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial", "Full commercial rights. No revenue caps. Available on flexible monthly or annual terms."],
        ["3ds Max Indie", "Full commercial rights. For freelancers and startups. Restricted to users below the regional revenue cap."],
        ["Autodesk Flex", "Pay-as-you-go token system. Best for occasional users. Deducts tokens only on the days you use it."],
      ] },
    ],
  },
  "aec-collection": {
    overview: [
      { type: "p", text: "The Autodesk AEC Collection Commercial is an all-in-one software ecosystem combining flagship CAD, 3D modeling, and cloud-connected BIM tools. It equips architecture, engineering, and construction teams with everything needed to transition projects from concept to final construction seamlessly." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Multi-Discipline BIM: Design, model, and document buildings with intelligent parametric tools for architecture, structure, and MEP.",
        "Precision Specialized CAD: Access standard drafting alongside vertical toolsets tailored for architecture, electrical, and mechanical design.",
        "Infrastructure & Civil Design: Streamline site layouts, corridor modeling, grading, and transportation design with automated tools.",
        "Pre-Construction Clash Detection: Combine trades into a single model to run interference checks and simulate construction schedules.",
        "Unified Cloud Environment: Securely manage, track, and share project documents across a centralized platform to minimize field errors.",
        "Reality Capture & Rendering: Convert laser scans into 3D models and generate cinematic renderings for client approvals.",
      ] },
    ],
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["License Tier", ""],
        ["Commercial Use", "Fully compliant for businesses, corporate enterprises, independent contractors, and government agencies (excludes educational use)."],
        ["Single-User Access", "Assigned directly to a specific user via their email address (Autodesk ID)."],
        ["Cloud-Managed", "Users can log in and download the software on multiple machines, but only one active session can run at any given time."],
        ["Electronic License Delivery (ELD)", "Fully digital distribution. Licenses are provisioned directly to your organization’s Autodesk Account portal for immediate deployment."],
      ] },
    ],
  },
  "autocad": {
    overview: [
      { type: "p", text: "Design the world around you with the industry-standard CAD software trusted by millions. Autodesk AutoCAD with Specialized Toolsets gives you access to seven discipline-specific toolsets—including Architecture, Mechanical, and Electrical—driving an average productivity gain of up to 63%. This AD Commercial package delivers an unrestricted, fully compliant commercial license tailored for business owners, enterprise engineering teams, and freelance professionals." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "All-In-One Power: Get standard AutoCAD alongside 7 distinct engineering toolsets under a single subscription.",
        "Massive Symbol Libraries: Instantly unlock over 750,000 intelligent parts, symbols, and components.",
        "Work Anywhere: Seamlessly sync across desktop, web browsers, and mobile devices via AutoCAD Web.",
        "Smart Automation: Speed up tracking with AI-driven object placement, smart text replacement, and automated revision comparisons.",
      ] },
    ],
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["License Class", "AD Commercial (Valid for commercial business production and enterprise workflows)."],
        ["Delivery Method", "ELD (Electronic License Delivery). Software downloads securely from your digital Autodesk Account. No physical box is shipped."],
        ["Seat Type", "Single-user Named License. Assigned securely via email to an individual team member."],
        ["Version Access", "Grants full rights to the latest version plus administrative rollback access to the 3 previous legacy versions"],
      ] },
    ],
  },
  "autocad-lt": {
    overview: [
      { type: "p", text: "AutoCAD LT Commercial is the industry-leading 2D computer-aided design (CAD) software trusted by millions of architects, engineers, and construction professionals worldwide. Engineered specifically for precision drafting, this commercial version grants full legal rights for use in for-profit projects, client deliverables, and professional environments. It delivers a streamlined, cost-effective toolset focused entirely on 2D design, allowing you to generate documentation faster and collaborate seamlessly across teams without paying for unused 3D features." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Precision 2D Drafting & Documentation: Create precise technical drawings with intuitive editing, shaping, and annotation tools.",
        "Smart Blocks & Automation: Automate repetitive counting tasks and find/replace blocks quickly across your entire canvas.",
        "AutoCAD Web and Mobile Apps: View, edit, share, and co-author drawings on the go from any browser or mobile device.",
        "DWG™ History & Compare: See past versions of your drawing side-by-side to track changes, edits, and evolutionary progress.",
        "Trace & Share Ecosystem: Review drawings safely and add feedback directly to a DWG file without altering the existing blueprint.",
        "Cross-Platform Compatibility: Work flawlessly with native support optimized for both Windows and macOS systems.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["AutoCAD LT Core Software", "Full commercial access to the 2D CAD engine.", "Electronic Software Download (ESD)"],
        ["AutoCAD Web App", "Browser-based CAD tool for on-the-fly edits.", "Cloud-Based Access via Web Browser"],
        ["AutoCAD Mobile App", "iOS and Android companion app for job-site viewing.", "App Store / Google Play Download"],
        ["Autodesk Cloud Storage", "Secure cloud space for file syncing and backup.", "Integrated Autodesk Account Storage"],
        ["Technical Support", "Direct access to Autodesk support experts.", "Online Ticket, Chat, and Scheduled Call"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Autodesk software is licensed strictly via a Named User Subscription Model. Licenses are tied directly to an individual's Autodesk Account, allowing the user to sign in and activate the software on multiple machines (though it can only be actively used on one device at a time).", ""],
      ] },
    ],
  },
  "autodesk-build": {
    overview: [
      { type: "p", text: "Autodesk Build bridges the gap between design and jobsite execution by centralizing communication, data collection, and document tracking. Built on a common data environment, it allows teams to manage day-to-day operations seamlessly from any device. It combines the best of PlanGrid and BIM 360 to deliver standardized forms, real-time quality tracking, and comprehensive cost insights, ensuring your projects finish on time and under budget." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Connected Project Management: Streamline submittals, RFIs, meeting minutes, and daily logs in one shared digital dashboard.",
        "Real-Time Field Collaboration: Access up-to-date 2D sheets and 3D BIM data directly on-site via mobile devices.",
        "Integrated Cost Control: Track change orders, monitor budgets, and forecast risks dynamically to safeguard profitability.",
        "Quality & Safety Tracking: Standardize safety checklists, log punch lists, and track real-time resolution of field issues.",
        "Predictive Insights & Reports: Leverage machine learning analytics to identify project risks before they stall construction.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Build Core Module", "Cloud tools for RFIs, submittals, schedules, and daily construction workflows.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system providing a single source of project truth.", "Cloud Platform"],
        ["Cost Management Extension", "Tools to manage cash flow, budgets, contracts, and financial change orders.", "Integrated Utility"],
        ["PlanGrid Mobile App", "Mobile field execution app optimized for fast sheet viewing and offline sync.", "iOS / Android App"],
        ["Insight & Administration", "Central dashboard for member permissions, custom templates, and cross-project reports.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Build 550 Sheet Plan (Commercial)", "Full commercial rights. Grants access to up to 550 active sheets across all active projects. Best for small-to-medium project teams."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows contractors and external vendors to bring their own Build 550 license into a client's hub without utilizing extra host seat allocations."],
      ] },
    ],
  },
  "autodesk-docs": {
    overview: [
      { type: "p", text: "Autodesk Docs serves as the foundation for the Autodesk Construction Cloud platform, providing a secure, centralized repository for all project data. It eliminates communication silos by allowing teams to review, markup, and approve 2D drawings, 3D models, and standard office documents from any device. Built-in permission controls, version histories, and automated approval workflows ensure that field teams, architects, and owners always collaborate on the correct, most up-to-date information." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Common Data Environment: Centralize all construction files, structural designs, and contracts in a single, secure cloud hub.",
        "Advanced 2D/3D Viewer: Preview, pan, zoom, and inspect complex CAD drawings and BIM models directly within your web browser.",
        "Markup & Issue Tracking: Layer public or private comments, callouts, and issue pins onto sheets to accelerate clash resolutions.",
        "Automated Approval Workflows: Streamline document review cycles with customized multi-step routing, electronic sign-offs, and status tracking.",
        "Complete Version Control: Retain a permanent history of document revisions with side-by-side visual comparisons to spot design changes instantly.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Docs Hub", "Cloud platform for advanced file storage, custom folder structures, and attribute tagging.", "Cloud Platform"],
        ["BIM 360 Document Management", "Companion access to legacy BIM 360 environments for older, active project architectures.", "Cloud Platform"],
        ["Autodesk Desktop Connector", "Background utility that syncs your local desktop file explorer directly to cloud project folders.", "Desktop Utility"],
        ["Mobile Access App", "On-the-go sheet viewing, issue tracking, and offline file synchronization for jobsite use.", "iOS / Android App"],
        ["Admin & Security Tools", "Rigorous role-based, company-based, and user-based folder access permission dashboards.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Single-User Commercial License", "Full commercial rights. Grants one dedicated user full cloud access to manage, view, and collaborate on project documents."],
        ["Flexible Term Contracts", "Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows consultants, clients, or subcontractors to bring their own Docs license into a project hub without using the host company's available seat inventory."],
      ] },
    ],
  },
  "autodesk-takeoff": {
    overview: [
      { type: "p", text: "Autodesk Takeoff streamlines the estimating process by allowing teams to capture project scopes using both 2D drawings and 3D models. Operating within a shared common data environment, it eliminates data silos and ensures that estimators always work off the latest design revision. By automating quantity calculations and linking takeoffs directly to construction documents, it reduces human error, cuts down on rework, and dramatically accelerates the bidding cycle." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Cloud-Based Quantification: Access and perform takeoffs anytime, anywhere, eliminating the need for bulky local software installations.",
        "Integrated 2D and 3D Takeoffs: Combine linear, count, and area takeoffs from PDF sheets with automated multi-dimensional takeoffs from 3D models.",
        "Custom Classification Systems: Upload and map your standard corporate or regional costing catalogs directly to your quantities.",
        "Real-Time Collaboration: Allow multiple estimators to work simultaneously on a single project package without risking duplicated counts.",
        "Automated Version Tracking: Receive immediate alerts when design files change, allowing you to instantly view and adjust impacted quantities.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Takeoff Module", "Unified workspace for 2D sheet takeoff and 3D model-based quantification.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system ensuring access to the latest construction documents.", "Cloud Platform"],
        ["Formula Engine Tool", "Tool for creating custom mathematical formulas to automate complex component calculations.", "Integrated Utility"],
        ["Takeoff Viewer & Panel", "Responsive browser-based interface for filtering, auditing, and sorting itemized takeoff outputs.", "Web Browser"],
        ["Insight & Analytics", "Central dashboard for visual reporting, data export, and permission management.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted access to both 2D and 3D cloud takeoff workflows for professional estimations."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows external estimators or trade partners to bring their own Takeoff license into a master project hub without drawing down host seat pools."],
      ] },
    ],
  },
  "bim-collaborate": {
    overview: [
      { type: "p", text: "Autodesk BIM Collaborate allows project teams to share design data, track progress, and coordinate models in a shared common data environment. Operating entirely in the cloud, it helps teams catch design errors and constructability issues early in the preconstruction lifecycle. It aggregates design models from Revit, Civil 3D, and AutoCAD into a single view, automating spatial coordination and providing actionable insights to eliminate costly on-site reworks and communication delays." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Automated Clash Detection: Aggregate multi-discipline models into shared coordination spaces to instantly spot spatial conflicts.",
        "Visual Change Analysis: Compare design changes between 3D model iterations side-by-side to understand project impacts instantly.",
        "Unified Issue Tracking: Create, assign, and track design issues to resolution using pinned locations directly on 2D sheets and 3D models.",
        "Design Timeline & Packages: Control how and when design data is shared with other project teams using formal packaging and tracking streams.",
        "Connected Navisworks Workflow: Sync cloud-based issue tracking directly with Navisworks Manage for advanced coordination and deeper field analysis.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["BIM Collaborate Module", "Cloud platform for automated model coordination, clash spaces, and matrix reviews.", "Cloud Platform"],
        ["Design Collaboration Module", "Timeline workspace for managing package handoffs and visual project updates.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management foundation ensuring access to the latest source drawings.", "Cloud Platform"],
        ["BIM 360 Workspace", "Legacy access to older project hubs hosted on the previous BIM 360 platform.", "Cloud Platform"],
        ["Coordination Utilities", "Desktop Connector integration and browser-based 3D multi-model aggregation tools.", "Cloud & Desktop"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants a single user cloud access to automated clash matrices, change reviews, and issue tracking."],
        ["Flexible Term Contracts", "Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows external consultants, structural engineers, or contractors to bring their own license into a client's hub without utilizing extra host seat allocations."],
      ] },
    ],
  },
  "bim-collaborate-pro": {
    overview: [
      { type: "p", text: "( 10, 25,50,100,500,1000)" },
    ],
    keyFeatures: [
      { type: "p", text: "See product overview for capabilities." },
    ],
    whatsIncluded: [
      { type: "p", text: "See the overview and key features for included components." },
    ],
    subscriptionLicensing: [
      { type: "p", text: "Contact Aptus for subscription and licensing options for this product." },
    ],
  },
  "civil-3d": {
    overview: [
      { type: "p", text: "Autodesk Civil 3D is the premier 3D software for civil infrastructure, site grading, and land surveying. Its intelligent, dynamic modeling automatically updates your entire design—from surfaces to utility networks—the moment changes are made. A commercial subscription gives engineering teams the automated tools and legal rights to optimize workflows, calculate earthworks, and deliver project sheets faster." },
    ],
    keyFeatures: [
      { type: "p", text: "Group the technical features into highly visible benefits for the end-user" },
      { type: "ul", items: [
        "Corridor & Road Modeling: Build intelligent, 3D dynamic models for highways, transit tracks, and local roads.",
        "Dynamic Site Grading: Automate complex grading designs for commercial lots, ponds, and surfaces while keeping volume tracking live.",
        "Pipe & Pressure Networks: Draft and analyze gravity-fed and pressurized utility systems, complete with depth checks and interference analysis.",
        "Automated Sheet Production: Instantly generate scaled construction plans, profiles, and cross-section sheets.",
        "Earthworks & Material Takeoffs: Run precise cut-and-fill calculations to output Quantity Take-Off (QTO) reports for strict project budgeting",
      ] },
    ],
    whatsIncluded: [
      { type: "p", text: "See the overview and key features for included components." },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Access Type", "100% digital deployment and delivery managed via the online Autodesk Portal Account."],
        ["Subscription Tiers", "Flexible procurement available in 1-year or 3-year commercial plans."],
        ["Commercial Rights", "Grants authorized business use for commercial, profit-generating operations."],
        ["Collaboration Add-ons", "Cloud-hosted multi-user options via the Autodesk Construction Cloud (ACC) and BIM Collaborate Pro. [1]"],
      ] },
    ],
  },
  "copilot-for-microsoft-365": {
    overview: [
      { type: "p", text: "Copilot for Microsoft 365 is an enterprise-grade, AI-powered productivity engine that integrates large language models (LLMs) with your organization's data inside the Microsoft 365 apps. Operating natively behind your tenant's security perimeter, it surfaces insights, drafts content, and automates complex workflows by safely parsing your emails, chats, meetings, and documents. This solution transforms natural language prompts into actionable assets across the entire Office suite, drastically reducing the time spent on administrative tasks while maintaining strict corporate data compliance." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Context-Aware Intelligence: Generates highly relevant responses by securely scanning your corporate data ecosystem (emails, files, chats) via the Microsoft Graph.",
        "Automated Meeting Synthesis: Summarizes live Microsoft Teams meetings in real time, capturing key discussion points, contrasting opinions, and action items without recording audio.",
        "Instant Content Drafting: Generates multi-page document drafts in Word, crafts email responses in Outlook, and builds structured presentations in PowerPoint from plain text prompts.",
        "Advanced Data Analysis: Analyzes massive Excel data sets, writes formulas, isolates statistical anomalies, and generates interactive data visualizations instantly.",
        "Enterprise Data Protection: Guarantees absolute data privacy, ensuring your company's intellectual property and prompts are never used to train public models.",
        "Cross-App Communication (Business Chat): Acts as a central AI coordinator across all your workplace apps to track down specific files, timeline updates, or project milestones.",
        "Extensible Architecture: Integrates seamlessly with third-party software, internal databases, and lines of business using custom Copilot Studio plugins.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Copilot in Word & Docs", "AI text generation, automated rewriting, and instant executive summaries of long articles.", "Windows, Mac, Web"],
        ["Copilot in Teams & Chat", "Live meeting transcript analysis, chat threat summaries, and automated daily action item lists.", "Windows, Mac, Web"],
        ["Copilot in Outlook", "Email draft generation, tone coaching, and long conversational thread summarizations.", "Windows, Mac, Web"],
        ["Copilot in PowerPoint", "Automated presentation building from Word files, custom slide generation, and text formatting.", "Windows, Mac, Web"],
        ["Copilot in Excel", "Python-assisted data modeling, trend predictions, and natural language formula generation.", "Windows, Mac, Web"],
        ["Microsoft Copilot Studio", "Full low-code toolset allowing IT teams to build, test, and publish custom organizational plugins.", "Included"],
        ["Base Microsoft 365 License", "Underlying cloud software platforms required to run the Copilot interfaces (e.g., E3, E5, Business Premium).", "Not Included (Required Prerequisite)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate cloud identity rather than a specific physical machine."],
        ["Prerequisite License Enforcement", "Requires an active underlying base enterprise license assigned to the same user profile (such as Microsoft 365 E3/E5, Office 365 E3/E5, or Business Basic/Standard/Premium)."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically based on organizational changes."],
        ["Flexible Mid-Term Scalability", "Available as a standalone user add-on with no minimum seat requirements, allowing organizations to pilot deployment scales freely."],
        ["No Maximum User Caps", "Designed to scale flawlessly from small business tenants up to massive multi-national corporations, supporting an unlimited number of seats."],
      ] },
    ],
  },
  "exchange-online-kiosk": {
    overview: [
      { type: "p", text: "Microsoft Exchange Online Kiosk is an entry-level, cloud-based business email solution designed specifically for frontline, shift, or deskless workers who do not have dedicated workstations. It provides a secure, cost-effective way for users—such as retail associates, manufacturing staff, or field technicians—to stay connected with company communications via web browsers or mobile devices. This plan delivers essential messaging, calendaring, and contact management infrastructure backed by enterprise-grade security, without the overhead of unused premium cloud apps." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Frontline Messaging Core: Access corporate email securely from any shared or public computer via a streamlined web interface.",
        "Essential Mailbox Capacity: Equip shift and deskless workers with a dedicated 2GB cloud mailbox space tailored for baseline operational communications.",
        "Shared Calendar Coordination: Schedule shifts, view team availability, and coordinate company-wide announcements seamlessly across the organization.",
        "Global Address List (GAL): Browse the complete corporate directory instantly to locate team members, departments, and store locations.",
        "Enterprise Anti-Malware Protection: Filter out spam, phishing attempts, and known malware strains automatically using Exchange Online Protection (EOP).",
        "Outlook Web Access Optimization: Deliver a fast, responsive user interface specifically optimized for low-bandwidth connections and mobile web browsers.",
        "Basic Mobile Connectivity: Sync corporate emails, folder structures, and contacts directly to personal or corporate smartphones.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Outlook on the Web", "Light browser-based email client optimized for shared terminal deployments.", "Web Browser Only"],
        ["Exchange Kiosk Mailbox", "2GB inbox allocation paired with standard security filtering protocols.", "Standard Component"],
        ["Exchange Online Protection", "Enterprise-grade spam, phishing, and transport rule enforcement layers.", "Included"],
        ["POP3 / IMAP Connectivity", "Protocol access to link the mailbox to basic alternative email clients.", "Included"],
        ["Outlook Mobile App Access", "Secure app-based login configurations on portable personal platforms.", "iOS & Android"],
        ["Exchange ActiveSync (EAS)", "Mobile synchronization protocol to update mail, calendars, and tasks on the move.", "Included"],
        ["Outlook Desktop Application", "Locally installable, high-performance offline desktop version of the Outlook app.", "Not Included (Requires E3/E5)"],
        ["In-Place Archiving & Legal Hold", "Advanced compliance archiving, unlimited storage retention expansions, and legal hold options.", "Not Included (Requires Plan 2)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual employee's corporate cloud identity rather than a specific physical machine."],
        ["Shared Terminal Deployment", "Perfectly structured for multi-user shift environments where employees log in sequentially to the same physical hardware."],
        ["Concurrent Web Sessions", "A single user seat allows the employee to log into their web environment concurrently across up to five devices or web browser instances."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum User Caps", "Designed without any deployment limits, enabling enterprise companies to deploy unlimited seats across their global tenant."],
      ] },
    ],
  },
  "fabrication-camduct": {
    overview: [
      { type: "p", text: "Autodesk Fabrication CAMduct enables mechanical, electrical, and plumbing (MEP) contractors to transition seamlessly from design models to shop floor production. It combines an extensive library of parametric sheet metal components with advanced nesting algorithms to maximize material efficiency and reduce scrap. By generating precise machine-specific NC code directly from fabrication models, it ensures consistent sheet metal manufacturing, accurate cost tracking, and streamlined delivery to the jobsite." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Comprehensive Component Library: Access a massive database of parametric rectangular, round, and oval ductwork specifications.",
        "Advanced Material Nesting: Utilize powerful automatic nesting algorithms to maximize sheet utilization and minimize material waste.",
        "Direct CNC Machine Drivers: Generate tailored NC code to directly drive specialized sheet metal cutters, plasma burners, and coil lines.",
        "Barcoding & Tracking: Print custom tracking labels with barcodes to track components from assembly to jobsite installation.",
        "Integrated Cost Estimating: Calculate reliable material, labor, and production costs dynamically based on custom shop parameters.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Fabrication CAMduct Core", "Desktop application for sheet metal manufacturing, nesting, and machine tooling.", "Local Installation"],
        ["CAMduct Components Library", "Shared parametric database for Imperial and Metric ductwork configurations.", "Local / Network Shared"],
        ["Post-Processors & Drivers", "Built-in translator tools to format files for a wide variety of CNC equipment.", "Local Utility"],
        ["Tracker & Label Utilities", "Auxiliary tools to format, customize, and print production barcodes.", "Local Utility"],
        ["Autodesk Desktop App", "Central hub for software updates, manufacturing patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted use for active sheet metal shops and corporate manufacturing pipelines."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Multi-User Migration Options", "Available under modern named-user standard plans, replacing older legacy perpetual network licenses."],
      ] },
    ],
  },
  "infodrainage": {
    overview: [
      { type: "p", text: "Accelerate your sustainable stormwater design workflow and streamline regulatory approvals from day one. The InfoDrainage Commercial Master Bundle is a production-ready model template and asset library engineered specifically for multi-story corporate, retail, industrial, and mixed-use land development projects. It eliminates hours of repetitive drainage setup, bringing immediate Autodesk InfoDrainage standardization and sustainable design compliance to your civil engineering practice. [1, 2]" },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Advanced BIM & Civil 3D Integration: Seamless round-tripping structures and surface data with Civil 3D to eliminate manual entry errors.",
        "Pre-Configured Regional Deluge Templates: Built-in rainfall curves and Huff distribution distributions tailored to regional commercial standards. [1]",
        "SuDS & LID Component Templates: Instantly size parametric rain gardens, bioretention cells, permeable pavements, and infiltration trenches.",
        "Automated Hydraulic Sizing Wizards: Smart algorithms optimize pipe sizes, pipe gradients, and online storage structures to prevent site flooding.",
        "Compliance Report Generation: Pre-formatted layout reports mapped to regulatory agency requirements for instant print-to-PDF submission. [1]",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Model Template", "1x Master Commercial Template with pre-set runoff methods, routing criteria, and boundary conditions", ".iddx (InfoDrainage 2024–2026+)"],
        ["SuDS & Structure Library", "50+ Custom inlet/outlet structures, proprietary stormwater filters, weir structures, and smart orifices", ".idlx (Fully Parametric)"],
        ["Rainfall & Deluge Data", "Global NOAA Atlas 14, NRCS, and standard synthetic storm profiles pre-loaded into the rainfall manager", "Pre-built in template"],
        ["Analysis Smart Reports", "5x Regulatory compliance reporting layouts covering pipe audits, hydraulic grade lines, and critical storm paths", "Pre-loaded"],
        ["Implementation Manual", "35-page digital implementation guide covering catchments, utility collision checks, and Civil 3D workflows", ".pdf Digital Download"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Single-User License", "1 user, up to 2 active workstations, and 12 months of free version updates for freelance civil engineers."],
        ["Team Design License", "Up to 10 users, shared network library deployment, 24 months of updates, and priority technical support."],
        ["Enterprise License", "Unlimited users across a corporate domain, floating network licensing, lifetime updates, and custom API onboarding"],
      ] },
    ],
  },
  "infowater-pro": {
    overview: [
      { type: "p", text: "Autodesk InfoWater Pro is a GIS-native desktop hydraulic modeling software that runs directly inside Esri ArcGIS Pro. Built for water utility engineers and consulting firms, it delivers a one-to-one data alignment between geographic information system (GIS) layers and the hydraulic model. The software leverages the industry-standard EPANET engine to simulate countless \"what-if\" scenarios. This allows operators to accurately plan, design, and manage resilient water distribution networks without maintaining separate, detached modeling databases." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWater Pro Core Engine", "Full access to hydraulic and water quality modeling tools inside ArcGIS Pro.", "Standard Component"],
        ["Advanced Extensions", "Bundled access to UDF, Multi-Species Analysis, and Pressure Zone Managers.", "Included"],
        ["Info360 Cloud Services", "Access to Info360 Cloud Model Service for advanced cloud-based simulation runs.", "Included"],
        ["Autodesk Web Services", "Cloud-based collaborative storage solutions like Autodesk Drive and Shared Views.", "Included"],
        ["Autodesk Technical Support", "Phone and online web support directly from senior Autodesk support specialists.", "Included"],
        ["Previous Version Access", "Permissions to download and run up to three previous versions of the software.", "Included"],
        ["Esri ArcGIS Pro License", "Required underlying GIS environment platform needed to run the InfoWater interface.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Access", "Licenses are tied directly to an individual's Autodesk ID rather than a specific machine."],
        ["Multi-Device Installation", "A assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop)."],
        ["Single Concurrent Session", "The software can only be actively run on one device at any given time per user."],
        ["Autodesk Flex Tokens", "A pay-as-you-go credit system ideal for occasional users or temporary project contractors."],
        ["Daily Token Deduction", "Tokens are deducted from a shared company pool only on the days the software is launched."],
      ] },
    ],
  },
  "infoworks-icm": {
    overview: [
      { type: "p", text: "Autodesk InfoWorks ICM Standard (officially designated as InfoWorks ICM Sewer in recent versions) is an advanced integrated catchment modeling software optimized for wastewater and sanitary sewer networks. It enables engineering firms and utility operators to build exceptionally fast, accurate, and collaborative hydraulic models of complex subsurface pipe infrastructure. By delivering unlimited 1D modeling capabilities, it serves as a central source of truth for capacity planning, system expansion analysis, and regulatory compliance without requiring a separate geographic information system (GIS) interface." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks ICM Sewer Engine", "Full access to unlimited 1D hydraulic and hydrologic modeling tools.", "Standard Component"],
        ["SWMM5 & ICM SIM Engines", "Native access to industry-standard computational routing solver systems.", "Included"],
        ["Cloud Simulation Services", "Access to Autodesk cloud database hosting and remote calculation nodes.", "Included"],
        ["Autodesk Drive & Storage", "Web-based storage and secure viewer links for remote client presentations.", "Included"],
        ["InfoWorks ICM Free Viewer", "Lightweight companion software allowing non-technical stakeholders to review model results.", "Included"],
        ["Autodesk Technical Support", "Direct web and phone access to advanced Autodesk utility infrastructure specialists.", "Included"],
        ["Full 2D Overland Mesh Expansion", "Complex 2D surface floodplain and overland storm flood tracking.", "Not Included (Requires InfoWorks ICM Ultimate)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Access", "Licenses are tied directly to an individual's Autodesk ID rather than a specific machine."],
        ["Multi-Device Installation", "An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop)."],
        ["Single Concurrent Session", "The software can only be actively run on one device at any given time per user."],
        ["Autodesk Flex Tokens", "A pay-as-you-go credit system ideal for occasional users or temporary project contractors."],
        ["Daily Token Deduction", "Tokens are deducted from a shared company pool only on the days the software is launched"],
      ] },
    ],
  },
  "infoworks-icm-ultimate": {
    overview: [
      { type: "p", text: "Autodesk InfoWorks ICM Ultimate is the premier integrated catchment modeling platform designed for advanced storm, sanitary, and river system simulations. Built for tier-one engineering firms, flood authorities, and major water utilities, it delivers a fully integrated, simultaneous 1D and 2D hydraulic engine. The software allows engineers to accurately model complex subsurface pipe networks alongside overland urban and riverine floodplains within a single, highly collaborative workspace. By utilizing high-performance GPU-accelerated computing, it resolves complex, large-scale flood risk scenarios rapidly and accurately." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Integrated 1D/2D Simulation Engine: Dynamically links subsurface sewer networks (1D) with complex surface topography (2D) to simulate realistic water movement and urban flooding.",
        "GPU-Accelerated 2D Mesh Computations: Leverages local graphics cards or cloud resources to execute millions of surface flow calculations exponentially faster than CPU-only processing.",
        "Flexible 2D Mesh Generation: Creates custom triangular mesh zones with variable resolutions to capture intricate structural details like roads, buildings, and flood defense walls.",
        "Comprehensive River and Floodplain Modeling: Simulates open channels, bridges, culverts, weirs, and complex tidal boundaries alongside stormwater runoff.",
        "Multi-User Master Database Architecture: Enables large, distributed teams to work concurrently on the same regional model with built-in version control and conflict resolution.",
        "Advanced Remote Cloud Simulation: Offloads massive, multi-scenario 2D runs to Autodesk’s cloud servers to instantly free up local engineering workstations.",
        "Automated Spatial Data Import: Directly ingests high-resolution LiDAR data, GIS layers, and CAD files to rapidly build and refresh terrain models.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks ICM Ultimate Engine", "Uncapped access to full 1D pipe modeling and advanced 2D overland flood routing.", "Standard Component"],
        ["GPU-Enabled Solver (ICM SIM)", "Native support for graphics card acceleration to run heavy 2D mesh computations locally.", "Included"],
        ["Cloud Simulation Services", "Uncapped ability to offload high-density 1D and 2D runs to remote Autodesk servers.", "Included"],
        ["InfoWorks ICM Free Viewer", "Complimentary standalone application for clients and reviewers to inspect finished model files.", "Included"],
        ["Autodesk Web Services & Storage", "Cloud database hosting environments paired with shared link generation for project collaboration.", "Included"],
        ["Autodesk Technical Support", "Priority access to senior Autodesk water infrastructure engineers via phone or digital tickets.", "Included"],
        ["Previous Version Rights", "Authorization to download, license, and deploy up to three historical versions of the software.", "Included"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Access", "Licenses are tied directly to an individual's Autodesk ID rather than a specific machine."],
        ["Multi-Device Installation", "An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop)."],
        ["Single Concurrent Session", "The software can only be actively run on one device at any given time per user."],
        ["Autodesk Flex Tokens", "A pay-as-you-go credit system ideal for occasional users or temporary project contractors."],
        ["Daily Token Deduction", "Tokens are deducted from a shared company pool only on the days the software is launched."],
      ] },
    ],
  },
  "infoworks-ws-pro": {
    overview: [
      { type: "p", text: "Autodesk InfoWorks WS Pro is an enterprise-level, standalone hydraulic modeling platform built to plan, design, and operate highly accurate clean water distribution networks. Unlike GIS-dependent applications, InfoWorks WS Pro uses a centralized master database architecture that allows large, multi-disciplinary engineering teams to collaborate on the same regional network model simultaneously. It enables utilities to build complex, standalone digital twins, connect directly to live telemetry, and execute heavy multi-core or cloud simulations to evaluate system performance and protect water quality." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfoWorks WS Pro Client Engine", "Complete workspace access to holistic 1D water distribution network building and analysis tools.", "Standard Component"],
        ["IWLive Pro Integration", "Built-in access to live baseline operational forecasting and real-time pipe burst or isolation tracking.", "Included"],
        ["Cloud Simulation Capabilities", "Ability to run highly scalable, multi-run calculations using remote cloud server computing resources.", "Included"],
        ["InfoWorks WS Pro Free Viewer", "A complimentary desktop app allowing review teams and clients to view simulation data assets without a active license.", "Included"],
        ["Autodesk Web Services & Drive", "Secure cloud-hosted database spaces combined with web link generation for collaborative team design reviews.", "Included"],
        ["Autodesk Technical Support", "Priority ticketing, web assistance, and phone support from Autodesk utility infrastructure specialists.", "Included"],
        ["Historical Version Availability", "Complete access to download, configure, and operate up to three previous release cycles of the core software.", "Included"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Access", "Licenses are tied directly to an individual's Autodesk ID rather than a specific machine."],
        ["Multi-Device Installation", "An assigned user can activate the software on up to three separate computers (e.g., office desktop, home setup, and field laptop)."],
        ["Single Concurrent Session", "The software can only be actively run on one device at any given time per user."],
        ["Autodesk Flex Tokens", "A pay-as-you-go credit system ideal for occasional users or temporary project contractors."],
        ["Daily Token Deduction", "Tokens are deducted from a shared company pool only on the days the software is launched."],
      ] },
    ],
  },
  "infraworks": {
    overview: [
      { type: "p", text: "Autodesk InfraWorks transforms the preconstruction phase by allowing teams to generate massive, data-rich 3D models of existing environments using real-world GIS data, satellite imagery, and point clouds. It bridges the gap between planning and detailed design by connecting directly to Autodesk Civil 3D and Revit pipelines. By running preliminary traffic, flood, and structural simulations within a visually stunning 3D landscape, it enables stakeholders to evaluate design alternatives, minimize project risks, and make faster, data-driven decisions." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Real-World Context Modeling: Aggregate vast amounts of GIS, BIM, and reality capture data to generate highly accurate 3D city or regional models.",
        "Parametric Civil Design: Sketch out conceptually detailed roads, multi-girder bridges, tunnels, and complex drainage networks using rule-based parameters.",
        "Environmental & Traffic Simulation: Run built-in visual simulations for vehicle traffic flow, terrain mobility, and line-of-sight analyses.",
        "Seamless Civil 3D/Revit Pipelines: Pass conceptual models directly to Civil 3D for detailed grading or to Revit for structural detailing without data loss.",
        "High-Fidelity Visual Presentations: Generate photorealistic renderings and fly-through animations to easily communicate project intent to public and private stakeholders.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfraWorks Core Software", "Desktop application for conceptual civil modeling, site planning, and simulation.", "Local Installation"],
        ["Model Builder Utility", "Cloud-powered service that automatically builds 3D environments using global open-source maps and GIS data.", "Integrated Cloud Service"],
        ["Autodesk Docs Integration", "Cloud-hosted document management access to publish, share, and collaborate on infrastructure models.", "Cloud Platform"],
        ["Component Libraries", "Extensive database of parametric road parts, bridge structures, street furniture, and vegetation models.", "Local / Network Shared"],
        ["Autodesk Desktop App", "Central hub for software updates, performance patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for engineering firms, municipalities, and professional infrastructure consultants."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Compatible with Autodesk's token system, allowing occasional users or external contractors to consume tokens only on the days the software is active."],
      ] },
    ],
  },
  "inventor-professional": {
    overview: [
      { type: "p", text: "Autodesk Inventor Professional provides a complete set of design and engineering tools for 3D mechanical design, simulation, visualization, and documentation. It enables engineering teams to create accurate 3D digital prototypes of complex machinery, consumer products, and industrial systems before fabrication. By integrating parametric, direct, and freeform modeling tools alongside advanced stress analysis and kinematic simulation, Inventor helps manufacturers reduce physical prototyping costs, minimize design errors, and streamline the transition from concept to the factory floor." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Professional-Grade 3D Modeling: Design complex parts and massive mechanical assemblies using flexible parametric, direct, and freeform modeling tools.",
        "Integrated Shape Optimization: Leverage generative design utilities to optimize components for weight reduction and structural integrity based on real-world constraints",
        "Advanced Simulation & FEA: Conduct integrated stress analysis, modal analysis, and kinematic simulations to evaluate product performance before manufacturing.",
        "Automated Tube, Pipe, & Cable Routing: Accelerate the design of complex hydraulic runs, rigid piping networks, and electrical wire harnesses with rule-based routing tools.",
        "Model-Based Definition (MBD): Embed 3D manufacturing dimensions, geometric tolerances (GD&T), and critical annotations directly into the 3D model for downstream production.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Inventor Professional Core", "Desktop application for 3D part modeling, assembly design, sheet metal, and detailing.", "Local Installation"],
        ["Standard Content Center", "Comprehensive cloud/local library of millions of standard components, fasteners, and steel shapes.", "Local / Network Shared"],
        ["Integrated FEA & Motion Simulation", "Finite Element Analysis and dynamic simulation tools for evaluating structural and mechanical loads.", "Local Plugin"],
        ["Autodesk Vault Basic", "Data management tool for tracking design histories, managing file relationships, and controlling revisions.", "Local / Server App"],
        ["Autodesk Docs & Shared Views", "Cloud-based collaboration tools to publish, review, and mark up 3D designs with clients or shop floors.", "Cloud Platform"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for manufacturing enterprises, engineering firms, and product design consultants."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Compatible with Autodesk's token system, allowing occasional engineers, external contractors, or toolmakers to consume tokens only on the active days of use."],
      ] },
    ],
  },
  "microsoft-365-apps": {
    overview: [
      { type: "p", text: "Microsoft 365 Apps for Business is a premium, desktop-focused productivity suite designed for small to medium-sized businesses that require advanced offline document editing and file storage without cloud-hosted email servers or collaboration platforms. Operating under Microsoft's New Commerce Experience (NCE) framework, it delivers always-updated, locally installable versions of core Office applications paired with secure cloud backup. This subscription serves as a powerful solution for organizations that prefer to handle their business email elsewhere (such as legacy local servers or third-party hosts) but need top-tier processing power and analytical tools on their physical devices." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["Strict 300-Seat Cap", "This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (Microsoft 365 Apps for Enterprise)"],
      ] },
    ],
  },
  "microsoft-365-business": {
    overview: [
      { type: "p", text: "Microsoft 365 Business Standard is the definitive productivity and collaboration suite tailored specifically for small to medium-sized businesses. Operating under Microsoft's New Commerce Experience (NCE) framework, it combines premium, locally installable desktop applications with enterprise-grade cloud communication services. This subscription serves as a unified digital workspace, allowing teams to manage custom business emails, conduct high-capacity virtual meetings, and securely collaborate on shared files from any location or device." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Office Desktop Apps", "Fully functional local software installations of Word, Excel, PowerPoint, Outlook, and OneNote.", "Windows & macOS"],
        ["Microsoft Teams App", "High-capacity virtual meeting rooms holding up to 300 concurrent participants.", "Standard Component"],
        ["Business Class Email Mailbox", "50GB primary mailbox per user paired with integrated shared calendars and malware filtering.", "Included"],
        ["OneDrive for Business", "1TB of dedicated cloud storage per user to back up and sync internal corporate assets.", "Included"],
        ["SharePoint Online (Plan 1)", "Collaborative corporate intranet portals and structured department document libraries.", "Included"],
        ["Operational Business Apps", "Direct access to productivity-driving services like Microsoft Forms, Planner, and Bookings.", "Included"],
        ["Microsoft Intune Device Management", "Advanced enterprise endpoint management, conditional access, and remote device wiping tools.", "Not Included (Requires Business Premium)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate identity rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["Strict 300-Seat Cap", "This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (E3/E5)."],
      ] },
    ],
  },
  "microsoft-365-business-basic": {
    overview: [
      { type: "p", text: "Microsoft 365 Business Basic is an agile, cloud-first productivity and collaboration suite designed to provide growing businesses with essential remote work tools. Operating under Microsoft's New Commerce Experience (NCE) framework, it shifts the workspace entirely to the cloud, using web browsers and mobile apps instead of local desktop installations. This cost-effective subscription gives teams business-class email, enterprise-grade video conferencing, and secure cloud storage, making it ideal for frontline personnel, remote staff, and startups." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Web-First Productivity: Create, edit, and co-author files simultaneously using real-time, browser-optimized versions of Word, Excel, PowerPoint, and OneNote.",
        "Intelligent Business Email: Build company credibility with a 50GB professional email inbox per user profile, utilizing your own custom domain name.",
        "Unified Collaboration Hub: Host virtual video or audio meetings for up to 300 participants, manage chat channels, and share files natively inside Microsoft Teams.",
        "Expansive Cloud Storage: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring automatic file backup and file-version recovery.",
        "Centralized Team Intranets: Build secure, department-wide internal portals, news feeds, and structured team document repositories using SharePoint Online.",
        "Ethical AI Chat Integration: Access Microsoft Copilot with web grounding through any browser to summarize long documents and gather data securely.",
        "Automated Data Gathering: Design professional feedback surveys, operational questionnaires, and simple employee timesheets instantly with Microsoft Forms.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Office for the Web", "Browser-optimized versions of Word, Excel, PowerPoint, Outlook, and OneNote.", "Web Browser Only"],
        ["Microsoft Teams App", "Full cloud access to video calling, direct messaging, and shared team workspace panels.", "Standard Component"],
        ["Business-Class Email Mailbox", "50GB primary mailbox per user profile paired with shared team calendars and custom spam filters.", "Included"],
        ["OneDrive for Business", "1TB of personal cloud storage space to safely store and share corporate digital files.", "Included"],
        ["SharePoint Online (Plan 1)", "Collaborative company intranet portals and group communication channels.", "Included"],
        ["Office Mobile Applications", "Core communication and document review applications optimized for handheld devices.", "iOS & Android"],
        ["Office Desktop Applications", "Locally installable, high-performance offline desktop versions of Word, Excel, or PowerPoint.", "Not Included (Requires Business Standard)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate cloud identity rather than a specific physical workstation."],
        ["Multi-Device Mobility", "A single named user can securely log into their Office web apps and corporate email concurrently across five phones, five tablets, and five browsers."],
        ["NCE Commitment Strictness", "Under the NCE framework, annual terms lock in your licensing seat counts and pricing. Seat reductions can only be made during the first 72 hours of purchase."],
        ["NCE Flexible Premium", "Opting for an NCE Monthly term adds a 20% price premium but allows your business to scale user seats up or down dynamically each month."],
        ["Strict 300-Seat Cap", "This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Businesses requiring more must transition to Enterprise tiers (E1/E3)."],
      ] },
    ],
  },
  "microsoft-365-e3": {
    overview: [
      { type: "p", text: "Microsoft 365 E3 is a comprehensive, cloud-first enterprise platform that integrates industry-leading productivity apps with advanced security and device management capabilities. Built for mid-to-large-scale organizations and enterprise environments, it combines the Office 365 suite with the Windows enterprise operating system and the Enterprise Mobility + Security (EMS) framework. This subscription enables distributed teams to collaborate securely in real time, automates device enrollment, and establishes robust corporate compliance baselines to safeguard business data across all endpoints." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Flagship Enterprise Productivity: Deploy full, locally installable versions of premium apps including Word, Excel, PowerPoint, Outlook, and OneNote.",
        "Unified Collaboration Hub: Coordinate team efforts with Microsoft Teams for enterprise chat, video conferencing, channel communication, and cloud-shared workspaces.",
        "Enterprise Mobility + Security (EMS E3): Protect corporate assets with identity-driven security features like Conditional Access and Azure Active Directory (Microsoft Entra ID) P1.",
        "Unified Endpoint Management: Automate application deployment and manage corporate and personal devices via Microsoft Intune and Windows Autopilot.",
        "Advanced Information Protection: Classify, label, and protect sensitive emails and files automatically using data loss prevention (DLP) policies.",
        "Core eDiscovery & Compliance: Execute content searches, mailbox holds, and basic legal retention schedules across your entire cloud organization.",
        "Enterprise Cloud Email & Storage: Equip each user seat with a business-class 100GB exchange mailbox and expandable cloud storage infrastructure.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Microsoft 365 Desktop Apps", "Premium desktop installations of Word, Excel, PowerPoint, Outlook, Access, and Publisher.", "Windows & macOS"],
        ["Exchange Online (Plan 2)", "100GB corporate mailbox per user featuring unlimited archiving and advanced anti-malware filters.", "Standard Component"],
        ["SharePoint Online & OneDrive", "Enterprise intranet portals paired with 1TB to 5TB of secure cloud file storage per user.", "Included"],
        ["Microsoft Intune", "Cloud-based mobile device management (MDM) and mobile application management (MAM).", "Included"],
        ["Windows Enterprise E3", "Cloud-activated upgrade license for advanced Windows OS security, management, and virtualization.", "Included"],
        ["Microsoft Entra ID P1", "Advanced identity defense tools including conditional access, risk alerts, and self-service password reset.", "Included"],
        ["Microsoft 365 Copilot Add-On", "Advanced generative AI companion workflows integrated directly into the core app suites.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user seat allows an employee to install and activate Office apps on up to five concurrent PCs/Macs, five tablets, and five mobile devices."],
        ["Centralized M365 Admin Center", "IT administrators can instantly provision, reassign, or revoke user licenses dynamically based on shifting personnel requirements."],
        ["CSP and Enterprise Agreement (EA) Pricing", "Licenses can be procured through Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements."],
        ["No Maximum Seat Caps", "Unlike Business-tier plans which cap out at 300 users, the E3 enterprise structure supports an unlimited number of users across your tenant."],
      ] },
    ],
  },
  "microsoft-defender-office-365-plan-1": {
    overview: [
      { type: "p", text: "Microsoft Defender for Office 365 (Plan 1) is a cloud-based email and collaboration security service designed to protect organizations against advanced, sophisticated threats. It acts as an intelligent security layer that extends the baseline protections of Exchange Online Protection (EOP). By leveraging global threat intelligence and sandboxing technologies, Plan 1 proactively shields corporate networks from high-risk vulnerabilities, including zero-day malware, malicious links, business email compromise (BEC), and credential phishing across email, SharePoint, OneDrive, and Microsoft Teams." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Safe Attachments Sandboxing: Analyzes unfamiliar email attachments in a secure virtual environment to detect and detonate zero-day malware before delivery.",
        "Safe Links Time-of-Click Verification: Scans and verifies web links (URLs) in real time when a user clicks them, protecting endpoints even if the destination page was weaponized after the email arrived.",
        "Anti-Phishing and Impersonation Defense: Uses machine learning models to detect email spoofing and prevent attackers from impersonating key executives or trusted brand domains.",
        "Collaboration App Protection: Extends enterprise security perimeters beyond email to block malicious files inside SharePoint Online, OneDrive for Business, and Microsoft Teams channels.",
        "Real-Time Detections Dashboard: Equips security teams with a unified administrative panel to monitor, filter, and review ongoing malware and phishing attempts across the tenant.",
        "Threat Explorer Basic Reporting: Provides security administrators with visible logs to identify which users are being targeted most heavily by malicious campaigns.",
        "Quarantine Management: Isolates suspicious messages automatically, allowing IT administrators to inspect payloads safely and manage user release requests.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Safe Attachments Core Engine", "Real-time file detonation and behavior analysis for inbound email attachments.", "Standard Component"],
        ["Safe Links Protection API", "Continuous URL rewriting and time-of-click validation across emails and Office apps.", "Included"],
        ["Teams & SharePoint Security", "Automated asynchronous scanning of uploaded files within collaboration spaces.", "Included"],
        ["Anti-Impersonation Policies", "Custom user and domain tracking configurations to prevent executive identity fraud.", "Included"],
        ["Real-Time Detection Reports", "Standard cloud-hosted reporting interfaces for tracking blocked malware, phish, and spam.", "Included"],
        ["Microsoft Security Center Integration", "Unified portal alignment alongside Microsoft Defender XDR tools.", "Included"],
        ["Automated Incident Investigation (AIR)", "Automated threat resolution playbooks and self-healing system actions.", "Not Included (Requires Plan 2)"],
        ["Attack Simulation Training", "Built-in phishing simulation builders and user awareness training assignments.", "Not Included (Requires Plan 2)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate cloud identity rather than a specific physical machine."],
        ["Tenant-Wide Coverage Rule", "To ensure consistent security compliance, a license must be assigned to every individual mailbox or user account protected by Defender policies."],
        ["Central M365 Security Center", "IT security administrators can centrally configure, tweak, and deploy protective policies across the entire corporate domain."],
        ["Flexible Standalone or Add-On Purchasing", "Available as an individual standalone add-on for basic Exchange plans, and comes pre-bundled inside higher suites like Microsoft 365 Business Premium."],
        ["No Maximum Seat Caps", "Designed to scale flawlessly from small business tenants up to massive enterprises, supporting an unlimited number of seats."],
      ] },
    ],
  },
  "microsoft-teams-essentials": {
    overview: [
      { type: "p", text: "Microsoft Teams Essentials is a professional, standalone collaboration and virtual meeting platform designed specifically for small businesses. It serves as a dedicated communication solution for organizations that already maintain an independent email hosting setup (such as Google Workspace) but require enterprise-grade video conferencing and group chat. By unbundling the core meeting engine from full Microsoft 365 productivity suites, it enables teams to connect with employees, customers, and partners via a single, cost-effective hub." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Extended Meeting Durations: Host continuous virtual video or audio group sessions lasting up to 30 hours per meeting.",
        "Massive Meeting Capacity: Connect distributed teams or external clients with support for up to 300 concurrent participants per session.",
        "Advanced Meeting Recordings: Capture live video calls alongside automated text transcripts and live English captions to reference later.",
        "Flexible Interactive Formats: Boost audience engagement during sessions using built-in breakout rooms, interactive polling, and custom Together Mode backdrops.",
        "Universal Calendar Sync: Integrate seamlessly with external scheduling systems, allowing direct, real-time synchronization with Google Calendar or on-premises Outlook setups.",
        "Continuous Group Chat: Maintain team-wide alignment via permanent group chat rooms, threaded channel conversations, and drag-and-drop file distributions.",
        "Built-In Data Protection: Secure all calls, direct messages, and cloud files automatically with native, enterprise-grade data encryption.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Microsoft Teams Application", "Full access to premium chat, calling, and long-duration video conferencing features.", "Windows, macOS, Mobile"],
        ["Dedicated Cloud Storage", "10GB of secure file cloud storage space allocated to each individual user profile.", "Standard Component"],
        ["Real-Time Web Collaboration", "Fluid access to manage team tasks, coordinate polls, and update active chat files simultaneously.", "Included"],
        ["Guest Access Control", "Authorization to invite external vendors, clients, or freelancers into channels and calls securely.", "Included"],
        ["Microsoft Technical Support", "Anytime access to phone and digital web assistance directly from Microsoft support specialists.", "Included"],
        ["Microsoft 365 Copilot Add-On", "Compatibility layer allowing the optional purchase of generative AI meeting assistance.", "Not Included (Sold Separately)"],
        ["Exchange Business Email", "Dedicated corporate mail hosting, custom domains, or large 50GB/100GB inboxes.", "Not Included (Requires Business Basic+)"],
        ["Office Desktop Applications", "Locally installable versions of desktop software like Word, Excel, or PowerPoint.", "Not Included (Requires Business Standard)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Mobility", "A single named user can log into the premium Teams application concurrently across five phones, five tablets, and five desktops."],
        ["Strict Tenant Seat Cap", "Designed explicitly for growing setups, enforcing a maximum hard limit of 300 user seats per organization."],
        ["Hybrid Plan Compatibility", "Organizations can co-license and mix Teams Essentials seats alongside other Microsoft 365 Business plans within a single corporate domain."],
        ["Central M365 Admin Portal", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically as personnel needs shift."],
      ] },
    ],
  },
  "microsoft-teams-rooms-pro": {
    overview: [
      { type: "p", text: "Microsoft Teams Rooms Pro (Without Audio Conferencing) is an enterprise-grade cloud subscription designed specifically to power dedicated meeting room devices and hardware consoles. It transforms physical meeting spaces—ranging from small huddle areas to massive boardrooms—into highly interactive, secure, and collaborative hybrid spaces. This specialized operational tier delivers advanced multi-screen video routing, smart AI-driven front-row layouts, and comprehensive remote device management, while intentionally omitting PSTN dial-in telephony capabilities to lower licensing costs for organizations using pure VoIP architectures." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Intelligent Front Row Layouts: Maximizes eye-level contact by placing remote video participants along the bottom of the screen while keeping active chat threads and shared content visible simultaneously.",
        "Dual-Screen Layout Support: Route video galleries and active shared presentations to separate physical displays concurrently to minimize visual clutter during large sessions.",
        "AI-Powered Device Enhancements: Leverages hardware-native AI to drive active speaker tracking, smart framing, and acoustic echo cancellation across certified meeting room setups.",
        "Proactive Device Management: Equips IT administrators with real-time hardware status metrics, automated software patch distributions, and remote configuration tools via the Teams Admin Center.",
        "Advanced Meeting Room Analytics: Tracks hardware utilization rates, call quality metrics, and spatial acoustics to help optimize future campus infrastructure investments.",
        "One-Touch Join Interface: Simplifies user interactions by surfacing active calendar invites onto the room’s touch console for instantaneous, one-tap meeting launches.",
        "Secure Wireless Sharing: Allows local participants to broadcast screens safely from personal laptops or mobile devices via Teams casting or proximity joins without physical cable plugins.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Teams Rooms Core OS App", "Unified room interface engine optimized for Microsoft Teams Rooms on Windows or Android platforms.", "Room Hardware"],
        ["Teams Admin Center (Pro)", "Advanced cloud portal used by IT to monitor room health, push updates, and generate health tickets.", "Cloud-Based"],
        ["Intelligent Audio & Video APIs", "Full system permissions to run multi-stream video feeds, person-by-person indexing, and room suppression.", "Standard Component"],
        ["Calendar Interoperability", "Native integration with Exchange Online to support calendar resource mailboxes and automatic room booking.", "Included"],
        ["Microsoft Intune Integration", "Cloud-based device enrollment infrastructure used to lock down and push security profiles to room consoles.", "Included"],
        ["Microsoft Entra ID (Plan 1)", "Core identity authentication layer used to secure the machine's cloud sign-in handshake.", "Included"],
        ["PSTN Audio Conferencing", "Traditional telephone dial-in and dial-out numbers for participants connecting without an internet connection.", "Not Included (Excluded)"],
        ["Physical Room Hardware", "Touch panels, peripheral cameras, soundbars, micro-PCs, and wall-mounting brackets.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Device-Based Allocation", "Unlike standard user subscriptions, this license is bound permanently to a specific, unique physical meeting room hardware system rather than an individual person's identity."],
        ["Dedicated Room Account", "The license provisions a secure resource mailbox profile (e.g., meetingroom1@company.com) allowing employees to invite the physical room directly via Outlook or Teams calendars."],
        ["Strict Hardware Isolation", "One license seat allows the active operational deployment of the Teams Rooms Pro suite on one single physical room system console setup."],
        ["Flexible Corporate Purchasing", "Licenses can be procured through Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum Room Caps", "Designed to scale flawlessly across corporate facilities, supporting the deployment of an unlimited number of room seats across your global IT tenant."],
      ] },
    ],
  },
  "microsoft-visio": {
    overview: [
      { type: "p", text: "Microsoft Visio Plan 2 is the premium, cloud-powered diagramming and vector graphics platform engineered for business analysts, IT professionals, and enterprise engineers. This subscription unlocks both the always-updated, full-featured Visio desktop application and the highly accessible Visio for the web interface. Built to transform complex data into clear visual structures, it enables organizations to map out intricate business processes, document network architectures, map databases, and visualize floor plans while collaborating in real time directly within the Microsoft 365 cloud environment. [1, 2, 3, 4, 5]" },
    ],
    keyFeatures: [
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
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user seat allows an employee to install and activate the Visio desktop app concurrently on up to five PCs, alongside web browser access."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically as corporate personnel needs shift."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum Seat Caps", "Designed without any user deployment limitations, enabling mid-sized and global enterprise organizations to deploy unlimited seats across their tenant."],
      ] },
    ],
  },
  "navisworks": {
    overview: [
      { type: "p", text: "Autodesk Navisworks Manage allows architecture, engineering, and construction professionals to pre-visualize entire projects before construction begins. It aggregates 3D data from disparate design applications—regardless of file size or format—into a unified project model. By combining automated clash detection, interference checking, time-liner scheduling, and quantification tools, Navisworks Manage helps preconstruction teams anticipate risks, resolve conflicts early, and eliminate expensive structural reworks on the jobsite." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Advanced Clash & Interference Detection: Automatically identify, isolate, and log spatial conflicts between multi-discipline design models before breaking ground.",
        "Unified Model Aggregation: Merge massive 3D models and design files from Revit, Civil 3D, AutoCAD, and non-Autodesk formats into one responsive scene.",
        "4D and 5D Simulation: Link 3D model geometry directly to construction schedules (4D) and cost tracking (5D) to visualize project timelines.",
        "Streamlined Quantification: Perform automated, high-speed material takeoffs from integrated 3D models or combined 2D sheet sets.",
        "Cloud-Connected Issues: Sync clash results dynamically with Autodesk BIM Collaborate to manage and assign field issues within a shared cloud environment.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Navisworks Manage Core", "Desktop application for advanced clash matrix detection, 3D model aggregation, and quantification.", "Local Installation"],
        ["Navisworks Simulate", "Companion tool for scene visualization, 4D/5D time-lining, and animation (without the clash matrix module).", "Local Installation"],
        ["Navisworks Freedom Viewer", "Complimentary distribution utility used to view compiled NWD files with field teams or external clients.", "Free Desktop App"],
        ["File Format Exporters", "Comprehensive plugins to export native CAD/BIM formats into lightweight Navisworks file formats (NWC).", "Integrated Plugins"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, coordination updates, and performance hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for general contractors, BIM managers, engineering consultants, and commercial developers."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Fully compatible with Autodesk's token system, allowing seasonal coordinators or external trade contractors to consume tokens only on the active days of use."],
      ] },
    ],
  },
  "navisworks-simulate": {
    overview: [
      { type: "p", text: "Autodesk Navisworks Simulate empowers architecture, engineering, and construction professionals to aggregate 3D data from multiple design applications into a single, lightweight project environment. Built for preconstruction scheduling and review, it helps teams analyze, communicate, and visualize project outcomes before construction begins. By combining scheduling data with 3D models (4D) and material tracking (5D), Navisworks Simulate ensures clear communication among stakeholders, smoother on-site logistics, and accurate material takeoffs." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Unified Model Aggregation: Combine massive 3D models and design files from Revit, Civil 3D, AutoCAD, and non-Autodesk applications into a single, responsive file.",
        "4D Schedule Simulation: Link 3D geometry directly to project schedules (such as Primavera or Microsoft Project) to visually simulate construction timelines",
        "5D Cost Quantification: Perform high-speed material takeoffs and measure distances, areas, and counts from integrated 3D models or 2D sheets.",
        "Photorealistic Rendering & Animation: Generate professional 3D walk-throughs, fly-bys, and photorealistic asset animations to effectively communicate project intent.",
        "Comprehensive Review Tools: Utilize sectioning tools, redlining capabilities, and comment tracking to review design packages with clients and field teams.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Navisworks Simulate Core", "Desktop application for project aggregation, 4D/5D simulation, rendering, and quantification.", "Local Installation"],
        ["Navisworks Freedom Viewer", "Complimentary distribution utility used to share compiled project files (NWD) with external field stakeholders.", "Free Desktop App"],
        ["File Format Exporters", "Comprehensive plugins to export native CAD and BIM formats into lightweight Navisworks files (NWC).", "Integrated Plugins"],
        ["Quantification Workbook", "Integrated utility for managing item catalogs, automated counts, and visual takeoff outputs.", "Local Utility"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, performance patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for general contractors, scheduling managers, estimators, and project owners."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Fully compatible with Autodesk's token system, allowing seasonal coordinators or external trade contractors to consume tokens only on active days of use."],
      ] },
    ],
  },
  "office-365-e1": {
    overview: [
      { type: "p", text: "Microsoft Office 365 E1 (No Teams) is a foundational, cloud-only enterprise subscription engineered for organizations requiring core business communication, cloud storage, and essential security features without integrated collaboration messaging platforms. Built for desktop-bound workforces, field staff, and shifting operational crews, this package moves productivity entirely to web browsers and mobile devices. It allows IT departments to provision enterprise-grade email, secure intranet spaces, and essential data compliance baselines cost-effectively, completely decoupled from any video conferencing or chat applications." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Web-First Enterprise Productivity: Create, edit, and share documents seamlessly via online web browser layouts of Word, Excel, PowerPoint, and OneNote.",
        "Business-Class Cloud Email: Connect distributed workforces with a high-capacity 50GB Outlook exchange mailbox per user featuring custom corporate domain routing.",
        "Centralized Corporate Intranet: Build institutional knowledge centers, department resource hubs, and structured document libraries using SharePoint Online.",
        "Personal Cloud Workspace: Equip each employee seat with 1TB of personal OneDrive cloud storage to safely sync, store, and access files from any machine.",
        "Automated Form and Data Collection: Design internal surveys, operational feedback forms, and customer questionnaires using Microsoft Forms.",
        "Essential Cloud Security: Protect email environments from spam, phishing, and known malware vectors using native Exchange Online Protection (EOP).",
        "Core Information Governance: Establish basic mailbox retention policies, execute tenant-wide keyword content searches, and maintain legal hold baselines.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Office for the Web", "Browser-optimized versions of Word, Excel, PowerPoint, Outlook, and OneNote.", "Web Browser Only"],
        ["Exchange Online (Plan 1)", "50GB business email inbox per user profile paired with shared calendars and web access.", "Standard Component"],
        ["SharePoint Online (Plan 1)", "Collaborative document repositories and internal team communication portals.", "Included"],
        ["OneDrive for Business", "1TB of secure personal cloud storage space allocated per individual active user seat.", "Included"],
        ["Microsoft Power Automate", "Basic workflow automation engine used to sync files, copy data, and route approval notifications.", "Included"],
        ["Office Mobile Apps", "Core productivity applications optimized for deployment on pocket-sized platforms.", "iOS & Android"],
        ["Microsoft Teams App", "Instant messaging channels, enterprise chat panels, and live video conferencing software.", "Not Included (Excluded)"],
        ["Office 365 Desktop Applications", "Locally installable, high-performance offline desktop versions of Word, Excel, or Outlook.", "Not Included (Requires E3/E5)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity rather than a specific physical machine."],
        ["Multi-Device Web Access", "Users can securely log into their Office web apps and email environments concurrently across five phones, five tablets, and five browsers."],
        ["Centralized M365 Admin Center", "IT administrators can instantly provision, reassign, or revoke user licenses dynamically based on shifting personnel requirements."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum User Caps", "Designed without the 300-seat limitations found in Business-tier plans, enabling organizations to deploy unlimited seats across their global tenant."],
      ] },
    ],
  },
  "office-ltsc-standard-2024": {
    overview: [
      { type: "p", text: "Microsoft Office LTSC Standard 2024 is a specialized, volume-licensed productivity suite engineered specifically for organizations requiring a fixed, unchanging feature set. As a Commercial Perpetual asset, it grants your enterprise permanent ownership of the software version with a one-time purchase, completely eliminating recurring subscription fees. Built for highly regulated industries, air-gapped secure labs, and manufacturing terminals, this Long-Term Servicing Channel (LTSC) release functions entirely offline. This setup allows organizations to run mission-critical applications without internet dependency or unexpected interface changes." },
    ],
    keyFeatures: [
      { type: "p", text: "\"Frozen in Time\" Servicing: Operates with a completely locked functional architecture, receiving critical security patches over a 5-year lifecycle without feature-creep." },
      { type: "ul", items: [
        "Zero Internet Dependency: Functions entirely offline without checking into online cloud validation servers, perfect for disconnected intranets.",
        "Dynamic Excel Capabilities: Leverage modern computational formula elements—including text manipulation arrays and dynamic image integration fields.",
        "Granular Group Policy Controls: Enables IT administrators to centrally configure, restrict, and silence background software behaviors using standard server policies.",
        "Unified Office Deployment Tool (ODT): Simplifies machine staging by allowing IT teams to execute silent, pre-configured network installations.",
        "Advanced Outlook Scheduling: Streamlines corporate meeting scheduling with automated message caching, priority sorting, and simplified calendar alignments.",
        "Hardware-Bound Stability: Reduces system crashes in multi-user terminal configurations by utilizing a predictable and highly optimized local hardware profile.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Word 2024 Desktop", "Core offline text processor featuring premium layout and translation templates.", "Windows & macOS"],
        ["Excel 2024 Desktop", "High-performance calculation matrix supporting advanced data sorting and visual arrays.", "Windows & macOS"],
        ["PowerPoint 2024 Desktop", "Professional slide builder supporting seamless local media embedding.", "Windows & macOS"],
        ["Outlook 2024 Desktop", "Local corporate communications hub managing calendars and mail rules.", "Windows & macOS"],
        ["OneNote Desktop App", "Visual digital notebook for structured team documentation and local item categorization.", "Windows & macOS"],
        ["Volume Activation (KMS/MAK)", "Native tools to authorize machine activations inside private network perimeters.", "Standard Component"],
        ["Terminal Services Support", "Explicit rights to host and access instances via remote desktop sessions.", "Included"],
        ["Access & Publisher 2024", "Advanced relational database managers and marketing design canvas layouts.", "Not Included (Requires Professional Plus)"],
        ["Cloud Services & AI Copilot", "Microsoft OneDrive storage integration, live cloud web co-authoring, and automated AI assistance.", "Not Included (Requires M365)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["One-Time Perpetual Asset", "This license operates on a pay-once model, establishing permanent ownership of the software edition without recurring subscription fees."],
        ["Per-Device Licensing Matrix", "Every license code is bound permanently to one unique physical computer rather than an individual person's user profile."],
        ["Concurrent Use Restriction", "Any number of corporate employees may use the software running on the licensed device sequentially, but only one user may access it at a time."],
        ["Primary Portable Device Right", "Unless licensed company-wide, a single license allows the primary user of the licensed computer to install the software on one secondary laptop for external work travel."],
        ["Microsoft CSP Volume Channel", "Distributed strictly through the Microsoft Commercial licensing framework (PerpetualVL2024 channel), consolidating software asset tracking within your company's tenant domain"],
      ] },
    ],
  },
  "oracle-primavera-p6": {
    overview: [
      { type: "p", text: "Oracle Primavera P6 Professional Project Management is the gold standard for heavy-discipline enterprise project management, critical path scheduling, and resource control. This specific commercial licensing variant grants an Application User Perpetual right of use, meaning your organization owns the software license indefinitely without mandatory recurring annual subscription fees. Engineered to handle large-scale, highly complex, and multi-faceted initiatives, it enables project schedulers, control managers, and engineers to orchestrate tens of thousands of activities, balance localized resource pools, and maintain complete structural integrity across global portfolio hierarchies." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Primavera P6 Professional Client", "Full local installation rights to the flagship heavy-client project scheduling engine interface.", "Windows Desktop"],
        ["Perpetual Core Software License", "Indefinite legal right to install and run the core software package without expiration dates.", "Standard Component"],
        ["P6 Optional Client Environment", "Lightweight desktop installation package designed specifically for remote users on lower bandwidth.", "Included"],
        ["SQLite / Local Database Engine", "Self-contained baseline database engine tailored for standalone desktop users or field laptop setups.", "Included"],
        ["Oracle Software Delivery Cloud", "Secure digital access portal to download core installation binaries and software deployment documentation packages.", "Included"],
        ["First Year Technical Support (Oracle Premier)", "First-year 24/7 technical troubleshooting access, patch updates, and system updates.", "Included (1st Year Mandatory)"],
        ["Subsequent Support & Upgrades (Years 2+)", "Optional, ongoing annual software maintenance updates and access to new major releases.", "Not Included (Renewed Annually)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Perpetual Legal Structure", "Unlike SaaS or cloud subscriptions, this license never expires or auto-terminates due to non-payment of subscription fees."],
        ["Application User Allocation", "This metric assigns the perpetual asset to a single, specific named individual authorized to use the software program, regardless of whether they are actively logged in."],
        ["Non-Concurrent Restriction", "Licenses cannot be pooled, split, or shared concurrently among multiple project managers or departments."],
        ["Flexible Database Targets", "A single licensed user can choose to point their local workspace toward a standalone local SQLite file or hook into an enterprise Oracle/Microsoft SQL server database."],
        ["Oracle Premier Support Alignment", "While the software use right is permanent, the access to patch rollouts, feature drops, and the Oracle support desk is maintained via a separate, optional annual renewal fee."],
      ] },
    ],
  },
  "oracle-primavera-p6-enterprise": {
    overview: [
      { type: "p", text: "Oracle Primavera P6 Enterprise Project Portfolio Management (EPPM) is a 100% web-based, enterprise-grade project portfolio management solution designed to prioritize, plan, manage, and execute large-scale programs and portfolios. This specific commercial licensing variant grants an Application User Perpetual right of use, giving your organization permanent ownership of the software license without mandatory recurring seat subscription fees. Built on a robust Java architecture and powered by centralized enterprise databases, P6 EPPM enables executive leadership, Project Management Offices (PMOs), and globally distributed teams to collaborate simultaneously on complex, multi-tiered project hierarchies with real-time performance visibility." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Perpetual Asset Ownership: Secure an infinite legal right to operate the software platform version, transitioning software costs into a capital expenditure (CapEx) asset.",
        "100% Web-Based Browser Interface: Access the complete portfolio infrastructure from anywhere through any modern web browser without local desktop client dependencies.",
        "Global Portfolio & EPS Management: Organize cross-regional projects into structured Enterprise Project Structures (EPS) and user-defined portfolios for high-level executive tracking.",
        "Interactive Executive Dashboards: Generate real-time visual scorecards and interactive web dashboards to monitor key performance indicators (KPIs) and project health.",
        "Cross-Project Resource Optimization: Analyze, track, and dynamically level labor, equipment, and material resources across the entire organization's active project ecosystem.",
        "P6 Team Member Web & Mobile Interface: Allow field workers to quickly submit timesheets, update task progress, and log issues using specialized mobile web layouts or native apps.",
        "Integrated Business Intelligence (BI): Utilize native reporting via Oracle BI Publisher to distribute complex, automated enterprise compliance matrices and standard corporate project templates.",
      ] },
    ],
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Perpetual Legal Structure", "Licenses do not expire or automatically terminate, guaranteeing your company operational continuity across its hosted database infrastructure."],
        ["Application User Allocation", "This metric assigns the perpetual asset to a single, specific named individual authorized to log into the P6 web or desktop software components."],
        ["Non-Pool able Licenses", "User allocations are strictly tied to specific profiles; licenses cannot be parsed out, shared concurrently, or split into generic floating company seats."],
        ["Enterprise Database Requirements", "Tailored specifically to point toward centrally hosted IT environments running full-scale Oracle Database installations or Microsoft SQL Server platforms."],
        ["Oracle Premier Support Alignment", "Access to ongoing software patch deployments, system compatibility hotfixes, and the live Oracle help desk requires an annual support renewal fee."],
      ] },
    ],
  },
  "oracle-software-update-license-support": {
    overview: [
      { type: "p", text: "Oracle Software Update License & Support is the foundational enterprise maintenance program required to sustain, secure, and evolve Oracle on-premises perpetual software assets. Rather than a standalone software application, this service acts as a mandatory first-year attachment to perpetual licenses—such as Primavera P6, Oracle Database, and WebLogic—granting organizations continuous access to critical security patches, version upgrades, and live 24/7 technical troubleshooting. It ensures that an enterprise's structural backend architecture remains optimized and compliant with changing operating systems and corporate IT perimeters." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Universal Version Upgrades: Grants immediate deployment rights to any major new product releases, functionality shifts, and system documentation enhancements without repurchase costs.",
        "Critical Patch Management: Provides instant access to Oracle's quarterly Critical Patch Updates (CPUs) and security alerts to continuously harden systems against vulnerabilities.",
        "24/7 Technical Support Desk: Delivers unrestricted access to Oracle Support Specialists via phone or the online My Oracle Support (MOS) ticketing ecosystem for rapid incident response.",
        "Tax, Legal, and Regulatory Updates: Automates localized compliance updates, keeping financial or reporting software tightly aligned with shifting regional regulations.",
        "Pre-Built Upgrade Scripts: Supplies automated data migration and database optimization scripts to simplify version hops between legacy environments and modern frameworks.",
        "Lifetime Support Policy Alignment: Integrates directly with Oracle’s multi-tiered lifecycle frameworks, moving seamlessly across Premier, Extended, and Sustaining support stages as software versions age",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["My Oracle Support (MOS) Portal", "Centralized, secure web environment used to submit service requests (SRs), search knowledge bases, and monitor system health.", "Standard Component"],
        ["Global Product Updates", "Continuous access to download software binaries for maintenance releases and major upgrades.", "Included"],
        ["Quarterly Security Bundles", "Scheduled and hotfix security patches created to proactively insulate local server nodes.", "Included"],
        ["Online Learning Resources", "Comprehensive administrative handbooks, patch notes, configuration checklists, and community support forums.", "Included"],
        ["Technical Phone Support", "Round-the-clock severity-based telephone escalation lines for business-critical system failures.", "Included"],
        ["Extended Platform Access", "Right to expand maintenance tracking to approved external cloud infrastructures (such as OCI, AWS, Azure, and GCP).", "Included"],
        ["New Software Licenses", "Subsurface core product permissions or net-new expansion deployment licenses.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Perpetual Maintenance Alignment", "Billed annually as a recurring percentage fee based on the total net cost of your organization's underlying perpetual software assets."],
        ["Matching Service Levels Rule", "Partial maintenance coverage is prohibited. Every single active license within a specific \"License Set\" must be uniformly supported at the same tier or completely dropped."],
        ["Customer Support Identifier (CSI)", "Maintenance parameters are managed under a unique, centralized CSI string, forcing organizational tracking compliance across all local users."],
        ["Reinstatement Financial Penalties", "Allowing a support contract to lapse triggers a 150% back-payment reinstatement fee, calculated from the day coverage dropped, if your team seeks to rejoin the program later."],
        ["License Reduction Tie-Ins", "Dropping coverage for unused seats requires a signed formal termination letter, permanently legally relinquishing ownership of those specific underlying licenses."],
      ] },
    ],
  },
  "planner-and-project-plan-3": {
    overview: [
      { type: "p", text: "Microsoft Planner and Project Plan 3 is a unified, cloud-based project and portfolio management (PPM) solution engineered for project managers, team leads, and enterprise planners. It bridges the gap between everyday agile task tracking and complex, heavy-discipline scheduling by combining the lightweight coordination of Microsoft Planner with the robust power of Project for the web and the Project Online desktop client. Operating natively within the Microsoft 365 cloud, this subscription enables organizations to optimize localized resource allocations, balance competing project portfolios, and maintain absolute structural control over timeline dependencies." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Advanced Desktop & Web Scheduling: Author and refine intricate schedules using either the premium offline Project Online desktop client or highly responsive web browser workspaces.",
        "Unified Project Views: Toggle instantly between multiple layout methodologies including highly visual Kanban boards, structured grid lists, and dynamic interactive Gantt charts.",
        "Intelligent Dependency Management: Map out absolute task relationships and link critical path items together to prevent project timeline drift across shifting scopes",
        "Enterprise Resource Optimization: Analyze, track, and dynamically level labor, equipment, and material metrics across your entire organization's active project ecosystem.",
        "Unified Planner Collaboration: Link high-level portfolio milestones seamlessly to operational, everyday team tasks managed inside Microsoft Planner.",
        "Interactive Power BI Reporting: Build out customized, deep analytics dashboards and portfolio summary reports utilizing pre-configured data pipelines.",
        "Native Microsoft Teams Integration: Embed active schedules, Kanban boards, and project chat feeds directly into collaborative Teams channels.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Project Online Desktop Client", "High-performance offline project building desktop application featuring local hardware acceleration.", "Windows Desktop Only"],
        ["Project for the web Engine", "Complete cloud-native browser access to modern grid, board, and timeline scheduling modules.", "Web Browser"],
        ["Premium Planner Capabilities", "Expanded access to advanced task management, custom card tagging, and unified task buckets.", "Included"],
        ["Project Online Mobile Apps", "Comprehensive access to view project health and update individual task progress statuses on portable devices.", "iOS & Android"],
        ["Project Web App (PWA)", "Central portal tailored for tracking timesheets, approving task updates, and reviewing resource usage tables.", "Included"],
        ["Collaborative Cloud Storage", "Dedicated cloud space per user seat to support real-time cross-device document and schedule syncing.", "Included"],
        ["Power BI Pro License", "Standalone high-level business intelligence data creation, publishing, and dashboard distribution rights.", "Not Included (Sold Separately)"],
        ["Core Microsoft 365 Business Apps", "Access to download and run core application suites such as Word, Excel, Outlook, or Teams.", "Not Included (Requires M365 Sub)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user can install and run the premium Project desktop app concurrently on up to five PCs, alongside web browser access."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically as personnel needs shift."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum Seat Caps", "Designed without the 300-seat limitations found in Business-tier plans, enabling organizations to deploy unlimited seats across their global tenant."],
      ] },
    ],
  },
  "planner-plan-1": {
    overview: [
      { type: "p", text: "Microsoft Planner Plan 1 is a cloud-native, intuitive task and lightweight project management platform designed for teams that need to organize, track, and collaborate on visual workflows. It bridges the gap between basic checklist applications and heavy, complex portfolio scheduling tools by offering an approachable, highly collaborative workspace. Operating natively within the Microsoft 365 cloud environment, this subscription equips team leads, agile squads, and operational departments with flexible tracking layouts to drive everyday project execution and maintain visibility over fast-moving team initiatives." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Visual Work Management: Create, update, and organize team tasks using highly interactive Kanban boards, structured grid lists, or timeline charts.",
        "Custom Task Organization: Tailor your boards by categorizing tasks into custom sprint blocks or priority buckets using color-coded labels and tags.",
        "Dynamic Timeline Views: Map out basic task relationships and track schedule durations visually using a clean, streamlined Gantt-style timeline view.",
        "Collaborative Task Cards: Attach rich information directly to individual task elements, including checklist sub-items, file hyperlinks, due dates, and real-time chat comments.",
        "My Tasks Dashboard: Consolidates every task assigned to a specific user across all active team plans into a single, personalized dashboard to streamline individual daily priorities.",
        "Native Teams Integration: Embed active project boards and timeline trackers directly into collaborative Microsoft Teams channels for seamless side-by-side communication.",
        "Automated Email Notifications: Keeps the team aligned by automatically triggering email and push alerts when tasks are assigned, altered, or approaching a due date deadline.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Premium Planner Web Engine", "Full cloud browser access to visual grid, Kanban board, and timeline scheduling modules.", "Web Browser"],
        ["Advanced Task Management", "Expanded access to custom task fields, tracking metrics, and dynamic dependencies.", "Standard Component"],
        ["To Do Application Sync", "Automatic background sync to feed assigned workspace items directly into a user's personal Microsoft To Do app.", "Included"],
        ["Planner Mobile Optimization", "Smooth browser and app-based accessibility to update task cards and check checklists on mobile platforms.", "iOS & Android"],
        ["Shared Cloud Storage", "Integrated document attachment storage for files uploaded directly onto collaborative task cards.", "Included"],
        ["Power BI View-Only Access", "Ability to view and interact with shared project analytics reports published to corporate dashboards.", "Included"],
        ["Project Online Desktop Client", "High-performance offline project building desktop application featuring local hardware acceleration.", "Not Included (Requires Plan 3/5)"],
        ["Enterprise Resource Levelling", "Cross-project resource matching algorithms, complex workload balancing, and global resource modeling.", "Not Included (Requires Plan 3/5)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate cloud account identity or work email rather than a specific physical machine."],
        ["Multi-Device Sync", "A single named user can securely access, edit, and update active project boards concurrently across five phones, five tablets, and five browsers."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically based on organizational changes."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum Seat Caps", "Designed to scale flawlessly from small business teams up to massive corporate entities, supporting an unlimited number of seats. [1, 2]"],
      ] },
    ],
  },
  "power-bi": {
    overview: [
      { type: "p", text: "Microsoft Power BI Pro is a cloud-based business intelligence platform that equips users with self-service analytics to discover insights, visualize data, and share interactive dashboards across an organization. Built for data analysts, business leads, and corporate decision-makers, it enables secure data modeling, real-time reporting, and collaborative decision-making. Operating natively within the Microsoft 365 cloud environment, this license provides individual users with the necessary infrastructure to publish and distribute dashboards securely, establishing a unified data culture while maintaining rigorous enterprise security standards." },
    ],
    keyFeatures: [
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
    whatsIncluded: [
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
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Two-Way Sharing Requirement", "Both the report author and the report recipient must possess a Power BI Pro (or higher) license to securely view and interact with shared content."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically as personnel reporting needs shift."],
        ["Flexible Standalone or Bundle Purchasing", "Available as an individual standalone user add-on, and comes pre-bundled inside premium enterprise suites like Microsoft 365 E5."],
        ["No Maximum Seat Caps", "Designed to scale flawlessly from small business teams up to massive multi-national corporations, supporting an unlimited number of users."],
      ] },
    ],
  },
  "power-bi-premium-per-user": {
    overview: [
      { type: "p", text: "Microsoft Power BI Premium Per User (PPU) is an advanced, enterprise-grade business intelligence license that grants individual users access to Premium capacity features without requiring a large-scale corporate tenant investment. Operating under Microsoft’s New Commerce Experience (NCE) framework, it is engineered for advanced data analysts, data scientists, and enterprise reporting leads. This tier delivers high-performance data modeling capabilities, larger dataset limits, advanced AI insights, and automated data pipelines to accelerate complex data transformation and enterprise-wide dashboard delivery." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Massive Model Sizes: Build and deploy complex data models with an expanded individual dataset limit of up to 100 GB of compressed RAM.",
        "Frequent Data Refreshes: Keep corporate dashboards synchronized with real-time operational shifts by scheduling up to 48 automated data refreshes per day.",
        "Advanced AI Analytics: Uncover hidden trends natively using advanced machine learning models, text analytics, image detection, and automated root-cause insights.",
        "Pixel-Perfect Paginated Reports: Design, format, and print highly structured operational documents (such as invoices, delivery manifests, and financial sheets) using Power BI Report Builder.",
        "Automated Dataflows & DataMart’s: Build self-service, no-code data warehouses and extract, transform, and load (ETL) ingestion pipelines directly within the cloud workspace.",
        "Advanced Lifecycle Management: Accelerate code transitions from testing to deployment safely using visual deployment pipelines and target environment matching.",
        "XMLA Endpoint Connectivity: Connect deep external modeling tools (such as Tabular Editor or DAX Studio) directly to the cloud dataset to streamline script optimization.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Power BI Desktop Application", "High-performance desktop data modeling and report building application featuring local computation.", "Windows Desktop Only"],
        ["PPU Premium Cloud Service", "Cloud workspace hosting featuring multi-gigabyte storage arrays and priority calculation nodes.", "Web Browser"],
        ["Power BI Report Builder", "Specialized authoring client engineered specifically to output print-ready, multi-page paginated reports.", "Windows Desktop Only"],
        ["Advanced Deployment Pipelines", "Visual stage management UI used to track, validate, and push report updates from Dev to Test and Production.", "Standard Component"],
        ["On-Premises Data Gateway", "Secure data pipeline bridge used to link cloud reports directly back to internal local databases.", "Included"],
        ["Power BI Mobile Applications", "Secure companion applications optimized for real-time mobile dashboard interaction and metric tracking.", "iOS & Android"],
        ["Tenant-Wide Premium Capacity", "Uncapped viewing rights for unlicensed users or entry-level Pro license holders across the entire organization.", "Not Included (Requires Capacity License)"],
        ["Base Microsoft 365 License", "Underlying office productivity apps like Excel, Outlook, or Teams.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Strict Sharing Validation", "Unlike dedicated tenant capacity, PPU operates on an isolated tier. To view or interact with a report hosted in a PPU workspace, both the author and the consumer must possess a PPU license."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["No Maximum User Caps", "Designed without any user deployment limitations, enabling organizations to deploy unlimited seats across their corporate domain."],
      ] },
    ],
  },
  "product-design-manufacturing-collection": {
    overview: [
      { type: "p", text: "The Autodesk Product Design & Manufacturing Collection (PDMC) is an enterprise-grade suite of professional CAD, CAM, and CAE applications. It provides engineering and manufacturing teams with a complete set of tools to design, simulate, and manufacture complex products. The IC Commercial designation indicates a fully compliant, professional Industry Collection license intended for profit-generating business operations. By unifying professional-grade 3D mechanical design with advanced simulation and CNC programming, this collection eliminates data silos and streamlines production from initial concept to the final factory floor layout." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Professional 3D Mechanical Design: Create complex parametric models, massive assemblies, and production-ready drawings.",
        "Integrated Simulation (FEA): Test stress, thermal response, vibration, and fatigue using advanced Nastran technology.",
        "Advanced CNC Machining (CAM): Generate high-efficiency 2.5-axis to 5-axis toolpaths directly inside your CAD workspace.",
        "Factory Floor Optimization: Plan, analyze, and optimize complete manufacturing facilities with visual layout tools.",
        "Automated Nesting: Optimize material yield for sheet metal cutting to minimize scrap and material costs.",
        "Associative Workflows: Downstream CAM toolpaths and simulation models update automatically when the base CAD design changes.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Name", "Description", "Detail"], rows: [
        ["Autodesk Inventor Professional", "3D Mechanical Design", "Delivers high-end parametric modeling, assembly design, and production drawings."],
        ["AutoCAD (with Toolsets)", "2D & 3D Drafting", "Accelerates drafting with specialized Mechanical, Electrical, and Plant 3D toolsets."],
      ] },
      { type: "p", text: "Fusion" },
      { type: "p", text: "Cloud CAD/CAM/CAE" },
      { type: "p", text: "Provides cloud-connected collaborative workspace for generative design and PCB engineering." },
      { type: "p", text: "Inventor Nastran" },
      { type: "p", text: "Advanced Simulation" },
      { type: "p", text: "Embedded FEA tool for structural, thermal, stress, and vibration analysis." },
      { type: "p", text: "Inventor CAM" },
      { type: "p", text: "CNC Programming" },
      { type: "p", text: "Generates 2.5-axis to 5-axis toolpaths directly inside the CAD viewport." },
      { type: "p", text: "Navisworks Manage" },
      { type: "p", text: "Project Review" },
      { type: "p", text: "Offers large-scale 3D clash detection and production line coordination." },
      { type: "p", text: "Factory Design Utilities" },
      { type: "p", text: "Layout Optimization" },
      { type: "p", text: "Optimizes factory floors using visual planning and digital factory models." },
      { type: "p", text: "Vault Basic" },
      { type: "p", text: "Data Management" },
      { type: "p", text: "Secures version control and tracks engineering design histories." },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Commercial Compliance", "Fully licensed for commercial, professional, and profit-generating business use."],
        ["Named User Licensing", "Assigned to specific individuals via their Autodesk Account for secure, flexible access on multiple devices."],
        ["Flexible Terms", "Available in standard subscription intervals including 1-Year and 3-Year terms to match project budgeting."],
        ["Global Access", "Includes rights to use the software home or during international travel based on Autodesk standard terms."],
        ["Cloud Benefits", "Includes cloud storage allocations and access to cloud-based rendering and generative design processing."],
        ["Technical Support", "Standard subscription grants access to Autodesk web support, updates, and community forums."],
      ] },
    ],
  },
  "project-professional-2024": {
    overview: [
      { type: "p", text: "Microsoft Project Professional 2024 is the premium desktop project management software built for project managers, scheduling engineers, and enterprise resource coordinators. As a Commercial Perpetual asset, it grants your enterprise permanent ownership of the software application version with a one-time purchase, completely eliminating recurring monthly cloud subscription fees. Operating natively on local system hardware, it provides a highly stable, offline platform to author intricate critical path schedules, balance competing resource pools, and maintain absolute structural control over timelines and budgets without requiring a permanent internet connection." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "One-Time Perpetual Asset: Pay once for permanent ownership of the desktop software edition, moving project management tooling from operational expenses (OpEx) to capital assets (CapEx).",
        "Advanced Scheduling Engine: Automate task scheduling, map complex task dependencies, and calculate forward/backward passes to instantly identify the critical path.",
        "Comprehensive Resource Management: Define distinct labor, equipment, and material pools to track costs, assign capacities, and dynamically level resources to prevent over-allocation.",
        "Granular Baseline Comparisons: Set and lock multiple baseline snapshots to measure real-time project variance against original timeline and budget estimations.",
        "Flexible Visual Layouts: Toggle project data instantly between high-fidelity Gantt charts, customized Kanban task boards, structured sheet grids, and timeline summary views.",
        "Built-In Reporting Templates: Generate professional project status dashboards, burndown charts, and cost overview summaries locally without external business intelligence add-ons.",
        "Project Server Interoperability: Connect the desktop client seamlessly to an on-premises Microsoft Project Server deployment to facilitate centralized, team-wide timesheet and schedule tracking.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Project Professional 2024 Client", "Full standalone desktop project building application featuring advanced stencils and resource solvers.", "Windows Desktop Only"],
        ["Perpetual Core Software License", "Indefinite legal right to install and run the core desktop scheduling engine without expiration dates.", "Standard Component"],
        ["Volume Activation (KMS/MAK)", "Enterprise deployment keys used to activate installations silently inside private or secure corporate network perimeters.", "Included"],
        ["Project Server CAL", "Client Access License authorizing the user to hook the desktop application directly into a centralized Project Server backend.", "Included"],
        ["Local Feature Updates", "Rolling access to download critical security hotfixes, bug patches, and stability updates for the 2024 edition life cycle.", "Included"],
        ["Base Hardware System / Unit", "Physical computer towers, workstation laptops, processing chips, or local device components.", "Not Included (Sold Separately)"],
        ["Project Online Cloud Services", "Access to web-first scheduling platforms like Project for the web or browser-based portfolio modules.", "Not Included (Requires Plan 3/5)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Pay-Once Perpetual Asset", "This license functions on a non-subscription legal framework, meaning the software license will never expire or auto-terminate."],
        ["Per-Device Licensing Matrix", "Every license code is bound permanently to one unique physical computer rather than a floating user account or cloud identity."],
        ["Multi-User Sequential Access", "Multiple team members can use the software running on the licensed workstation sequentially, but only one active user can operate it at any single time."],
        ["Microsoft CSP Volume Channel", "Distributed strictly through the Microsoft Commercial licensing framework, consolidating software tracking and key provisioning inside your company's central admin domain."],
        ["Total Cloud Independence", "The core client application executes entirely locally and does not require an active internet connection to build, edit, or save mission-critical project files."],
      ] },
    ],
  },
  "revit": {
    overview: [
      { type: "p", text: "Autodesk Revit delivers an all-in-one BIM solution that enables design and construction teams to bring high-quality architectural concepts to physical realization. Unlike standard 2D drafting tools, Revit captures a complete digital representation of a building where every wall, pipe, and beam is an intelligent parametric component. This unified database ensures that any structural modification made anywhere in the project instantly updates across all 2D sheets, 3D views, schedules, and sections—eliminating coordination errors, streamlining documentation, and driving smoother on-site execution." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Multidisciplinary BIM Workspace: Access specialized toolsets for architectural design, structural engineering, and mechanical, electrical, and plumbing (MEP) fabrication detailing within a single platform.",
        "Parametric Components: Create intelligent 3D building blocks (Families) that hold physical property parameters, dimensions, and operational data.",
        "Automated Documentation: Generate precise 2D plans, elevations, details, and material schedules that dynamically update in real time as the 3D design changes.",
        "OpenBIM & IFC Support: Collaborate seamlessly across different software applications with native support for international IFC standards and advanced file interoperability.",
        "Integrated Analysis Tools: Run preliminary structural load tests, energy consumption evaluations, and computational fluid dynamics (CFD) workflows directly inside the design model.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Revit Core Software", "Unified desktop application for architectural design, structural engineering, and MEP system modeling.", "Local Installation"],
        ["Parametric Component Library", "Deep database of pre-built doors, windows, steel connections, light fixtures, and duct geometries.", "Local / Network Shared"],
        ["Autodesk Insight Engine", "Cloud-powered analytical tool used to run environmental performance and carbon footprint simulations.", "Integrated Cloud Service"],
        ["Autodesk Docs Interoperability", "Background cloud integration to share 3D models and sync work packages into a common data environment.", "Cloud Platform"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, design hotfixes, and product additions.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Single-User License", "1 user, up to 2 active devices, and 12 months of free version updates for solo practitioners."],
        ["Team Studio License", "Up to 10 users, BIM 360/ACC server deployment, 24 months of updates, and priority email support."],
        ["Enterprise License", "Unlimited users across a corporate domain, lifetime updates, and a live onboarding session."],
      ] },
    ],
  },
  "windows-11-pro": {
    overview: [
      { type: "p", text: "Windows 11 Pro Commercial Perpetual (specifically SKU variant 0004 under the Microsoft Cloud Solution Provider program) is an enterprise-grade commercial upgrade license. It permanently transforms a baseline consumer operating system into a secure business workstation. Engineered for small to medium businesses and managed corporate fleets, this software asset provides lifetime ownership with no recurring subscription fees. It grants IT administrators the essential management tools, data protection protocols, and native identity frameworks needed to orchestrate hybrid workforces safely." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Advanced BitLocker Encryption: Insulates confidential corporate data assets from unauthorized physical access or data theft by encrypting the complete local hard drive volume. [1, 2, 3, 4, 5]",
        "Microsoft Entra ID / Domain Join: Links corporate laptops natively to cloud identity directories, allowing single sign-on (SSO) configuration and unified network policy compliance. [1, 2, 3, 4]",
        "Windows Information Protection (WIP): Restricts data leakage paths by systematically boxing off and separating corporate data from personal user applications. [1, 2, 3, 4]",
        "Remote Desktop Host Control: Enables employees to securely access files, folders, and applications hosted on their primary office workstation from external locations.",
        "Windows Sandbox Environment: Executes suspicious or untrusted software configurations inside a lightweight, isolated desktop space that discards all code cleanly upon closing.",
        "Granular Group Policy Management: Empowers IT infrastructure specialists to customize user interface permissions, restrict peripheral devices, and enforce network-wide update pacing.",
        "Hyper-V Virtualization: Hosts completely distinct operating system installations simultaneously on a single computer using local hardware hypervisor acceleration.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Perpetual Edition Upgrade", "Lifetime authorization to elevate a qualifying base device to full Windows 11 Pro functionality permanently.", "Standard Component"],
        ["Microsoft Digital Fulfillment", "Cloud-based allocation of genuine digital product activation keys via your partner portal.", "Included"],
        ["Windows Update for Business", "Access to download and configure rolling monthly security patches and core operating updates indefinitely.", "Included"],
        ["Native M365 Integration Hooks", "Built-in authentication hooks to streamline deployments of Office 365 or Azure cloud security tools.", "Included"],
        ["Windows Media Creation Tool", "Digital access to construct pristine operating system deployment packages or clean-install USB drives.", "Included"],
        ["Base Hardware System / Unit", "Physical laptop units, motherboard setups, processing chips, or local device components.", "Not Included (Sold Separately)"],
        ["Microsoft 365 Applications", "Cloud productivity software suites such as Word, Excel, PowerPoint, or Outlook.", "Not Included (Requires Subscription)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["One-Time Perpetual Asset", "This license operates on a pay-once model, establishing permanent ownership of the platform without annual renewal fees."],
        ["Per-Device Licensing Matrix", "Every license code is bound permanently to one unique physical computer and cannot be dynamically transferred or pooled."],
        ["Qualifying OS Requirement", "Designed strictly as an upgrade path, requiring the physical workstation to possess an underlying base operating system license (e.g., Windows 10/11 Home)."],
        ["Microsoft CSP Architecture", "Distributed through the Microsoft Cloud Solution Provider (CSP) framework, aligning software tracking instantly with your company's central admin domain."],
        ["Permanent Edition Lock", "Upgrades the physical device to Windows 11 Pro indefinitely, allowing hard drive wiping or operating system reinstalls on that specific hardware profile without re-licensing costs."],
      ] },
    ],
  },
  "windows-server-2025": {
    overview: [
      { type: "p", text: "Windows Server 2025 Standard is a cloud-ready, hybrid-optimized server operating system engineered to power on-premises data centers, application hosting, and localized infrastructure workloads. This specific commercial variant delivers a Perpetual 16 Core Base License Pack, establishing a lifetime asset right with zero recurring monthly subscription or seat costs. Designed for physical environments or minimally virtualized deployments, it introduces cutting-edge capabilities like native hotpatching, advanced multi-layered SMB over QUIC security, and seamless hybrid management loops tied directly into the Microsoft Azure framework." },
    ],
    keyFeatures: [
      { type: "ul", items: [
        "Base Core-Compliance Baseline: Serves as the official foundational license pack required to satisfy Microsoft’s mandatory 16-core minimum per physical server baseline rule.",
        "Dual Virtual OSE/VM Rights: Grants deployment authorization for up to two virtual machines (VMs) or Hyper-V containers when all physical cores on the target host are fully licensed.",
        "Azure Arc-Enabled Hybrid Scale: Integrates directly with Azure Arc out of the box, allowing IT teams to orchestrate local servers, monitor performance metrics, and provision cloud features from a single portal.",
        "Next-Gen Storage Performance: Maximizes structural input/output operations using modernized storage engine layers, including significant NVMe storage optimizations and storage bus enhancements.",
        "Hardened Active Directory (AD): Insulates corporate directory networks from credential exploitation with advanced cryptographic security upgrades and scalable 32k database page sizes.",
        "Advanced Multi-Core Hardware Scale: Supports massive local hardware deployments, scaling to handle configurations containing up to 2,048 logical processors and 4 PB of physical RAM.",
        "Integrated Windows Defender: Deploys native, multi-layered system protection mechanisms to insulate the underlying server boot sectors from real-time rootkits, malware, and ransom scripts.",
      ] },
    ],
    whatsIncluded: [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Windows Server 2025 Core Software", "Digital access to download the full-scale Standard edition operating system installation ISO payload.", "Standard Component"],
        ["16-Core Base License Asset", "Lifetime legal entitlement to execute the software environment across up to 16 physical cores.", "Included"],
        ["Primary System MAK / KMS Key", "One unique Master Activation Key (MAK) generated to authenticate your primary hardware node.", "Included"],
        ["Hyper-V Virtualization Hypervisor", "Local hardware hypervisor engine enabling concurrent virtual system environment hosting.", "Included"],
        ["Rolling Security Hotfixes", "Five years of standard mainstream support paired with five years of extended lifecycle security patches.", "Included"],
        ["User / Device CALs", "Client Access Licenses required for every unique employee or machine talking to the server.", "Not Included (Sold Separately)"],
        ["Additional Core Add-on Packs", "Specialized 2-core expansion packs required if your physical server contains more than 16 total cores.", "Not Included (Sold Separately)"],
      ] },
    ],
    subscriptionLicensing: [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["One-Time Perpetual Asset", "This license operates on a pay-once model, establishing permanent ownership of the operating system version without recurring monthly subscription fees."],
        ["Core-Based Licensing Model", "Follows Microsoft’s standard physical core-allocation architecture, which dictates that all physical cores on the server must be licensed (minimum 8 cores per CPU / 16 per server)."],
        ["Stackable Virtualization Rights", "To run more than 2 VMs on the same hardware, you can \"stack\" additional licenses by purchasing an identical number of core licenses to cover the physical server again."],
        ["Microsoft CSP Volume Channel", "Distributed strictly through the Microsoft Commercial licensing framework, consolidating hardware validation data and key management within your company's central admin domain."],
        ["Hardware-Bound Identity", "The core software activation footprint maps explicitly onto the hosting physical server infrastructure and cannot be dynamically pooled or split across separate locations."],
      ] },
    ],
  },
};

function normalizeName(label: string): string {
  return label.trim().toLowerCase().replace(/^\([^)]*\)\s*/, "");
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const NAME_ALIASES: Record<string, string> = {
  autocad: "autocad",
  "civil 3d": "civil-3d",
  "aec collection": "aec-collection",
  "autocad lt": "autocad-lt",
  "autocad revit lt suite": "autocad-revit-lt-suite",
  "3ds max": "3ds-max",
  navisworks: "navisworks",
  "navisworks manage": "navisworks",
  revit: "revit",
  "oracle primavera p6": "oracle-primavera-p6",
  "power bi": "power-bi",
  "power bi pro": "power-bi",
  "microsoft visio": "microsoft-visio",
  "microsoft 365 business": "microsoft-365-business",
  "microsoft 365 business standard": "microsoft-365-business",
  "forma design collaboration": "bim-collaborate-pro",
  "bim collaborate pro": "bim-collaborate-pro",
};

function resolveContentKey(input: { productName: string; slug?: string }): string | undefined {
  if (input.slug && CONTENT[input.slug]) return input.slug;
  const byName = NAME_ALIASES[normalizeName(input.productName)] ?? slugify(input.productName);
  if (CONTENT[byName]) return byName;
  return undefined;
}

function genericFeatureBullets(productName: string): string[] {
  const lower = productName.toLowerCase();
  if (lower.includes("autocad") || lower.includes("revit") || lower.includes("civil")) {
    return ["2D & 3D design", "Industry toolsets", "Cloud collaboration", "Automation tools"];
  }
  if (lower.includes("adobe") || lower.includes("photoshop") || lower.includes("illustrator")) {
    return ["Creative workflows", "Cloud libraries", "Team collaboration", "Regular updates"];
  }
  if (lower.includes("microsoft") || lower.includes("365") || lower.includes("visio")) {
    return ["Business productivity", "Cloud sync", "Security & compliance", "Ongoing updates"];
  }
  return [
    "Genuine commercial licensing",
    "Publisher-backed support options",
    "Implementation and renewal assistance from Aptus",
    "Flexible subscription or perpetual terms where available",
  ];
}

export function buildGenericProductContent(
  productName: string,
  brandLabel: string,
  description?: string,
): ProductDetailContent {
  return {
    overview: [
      {
        type: "p",
        text:
          description ??
          `${productName} from ${brandLabel} is available through Aptus Infotech with genuine licensing, expert guidance, and local support in Oman.`,
      },
    ],
    keyFeatures: [{ type: "ul", items: genericFeatureBullets(productName) }],
    whatsIncluded: [
      {
        type: "table",
        headers: ["Included Component", "Description", "Delivery Method"],
        rows: [
          ["Software license", `Authorized ${productName} license or subscription as quoted.`, "Electronic delivery (ELD)"],
          ["Publisher support", "Vendor support and updates per your license agreement.", "Vendor portal"],
          ["Aptus account management", "Quoting, provisioning, renewals, and billing support.", "Aptus customer portal"],
        ],
      },
    ],
    subscriptionLicensing: [
      {
        type: "table",
        headers: ["Licensing Option", "Description"],
        rows: [
          ["Commercial New", "For organizations adding new seats or starting a new agreement."],
          ["Renewal Subscription", "Extend an active contract without service interruption."],
          ["Term options", "Annual (12-month) and multi-year agreements where offered."],
          ["Delivery", "Electronic license delivery through Aptus with setup guidance."],
        ],
      },
    ],
  };
}

export function getProductDetailContent(
  productName: string,
  fallback?: { brandLabel: string; description?: string; slug?: string },
): ProductDetailContent {
  const slug =
    fallback?.slug ??
    NAME_ALIASES[normalizeName(productName)] ??
    slugify(productName);

  if (ADOBE_ORIGINAL_DETAIL_SLUGS.has(slug)) {
    return buildGenericProductContent(
      productName,
      fallback?.brandLabel ?? "Adobe",
      fallback?.description,
    );
  }

  const key = resolveContentKey({ productName, slug: fallback?.slug });
  if (key) return CONTENT[key];
  return buildGenericProductContent(
    productName,
    fallback?.brandLabel ?? "Software",
    fallback?.description,
  );
}

export function productDetailContentKeys(): string[] {
  return Object.keys(CONTENT);
}

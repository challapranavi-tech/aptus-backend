/**
 * Product detail content imported from docx-tmp/*.txt (Word document exports).
 * Re-run after updating Word exports: node frontend/scripts/build-word-catalog-detail.mjs
 */

import type { ProductDetailContent } from "./product-detail-content";

export const WORD_CATALOG_DETAIL_CONTENT: Record<string, ProductDetailContent> = {
  "adobe-acrobat-pro": {
    overview:     [
      { type: "p", text: "Adobe Acrobat Pro for Teams is the industry-standard PDF and e-signature productivity platform built to simplify secure, collaborative document workflows. This specific deployment variant provides complete cross-platform compatibility across multiple operating systems, natively supporting English alongside over 20 additional European languages. Managed via a centralized cloud dashboard, it equips distributed workforces with the premium tools necessary to create, edit, protect, and legally sign documentation simultaneously from any desktop or mobile device." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Centralized Team Administration: Reassign, track, and deploy user seats dynamically across the department via the web-based Adobe Admin Console",
        "Native Multi-Language Support: Work seamlessly in preferred regional formats, fully supporting Multi European Languages (such as French, German, Spanish, and Italian)",
        "Advanced PDF Editing: Modify text and images, reorder layouts, split large documents, and convert PDFs directly to editable Microsoft Office formats",
        "Integrated Adobe Acrobat Sign: Send, track, and collect legally binding electronic signatures with real-time status notifications",
        "Real-Time Group Reviews: Gather team-wide feedback inside a single shared PDF file with live commenting and interactive annotations",
        "Enterprise-Grade Protection: Safely redact sensitive information, restrict printing permissions, and apply strong password encryption",
        "Mobile Productivity: Scan paper documents, fill out complex digital forms, and sign files on the go using the Adobe Acrobat Reader app.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Acrobat Pro Desktop Software", "Premium installation package optimized for native desktop performance.", "Windows & macOS"],
        ["Acrobat Mobile Apps", "Comprehensive access to premium features on portable devices.", "iOS & Android"],
        ["Adobe Admin Console", "Central IT console to provision user seats and monitor license compliance.", "Cloud-Based"],
        ["Advanced E-Signatures", "Premium tools to request, track, and legally authenticate signature assets.", "Standard Component"],
        ["Adobe Cloud Storage", "Dedicated cloud space per user seat to support real-time cross-device document syncing.", "Included"],
        ["Acrobat Web Services", "Access to full PDF creation, conversion, and compression tools via internet browsers.", "Included"],
        ["Continuous Updates", "Immediate, automatic access to newly released features, bug fixes, and security patches.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual team member's corporate Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Acrobat Pro on up to two separate computers (e.g., office workstation and home laptop)."],
        ["Single Concurrent Session", "The software can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date"],
      ] },
    ],
  },
  "adobe-business-creative-solutions": {
    overview:     [
      { type: "p", text: "Adobe Creative Cloud for Teams All Apps is the definitive, industry-standard creative platform that provides an entire suite of professional design, video, web, and photography applications. This specific commercial deployment variant offers full cross-platform compatibility across multiple operating systems, natively supporting English alongside over 20 European languages. Managed via a centralized cloud dashboard, it equips creative departments, agencies, and marketing teams with the comprehensive tools needed to collaborate on, sync, and deliver high-impact digital content from any location." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Complete Creative Suite Access: Deploy over 20+ flagship applications including Photoshop, Illustrator, Premiere Pro, InDesign, After Effects, and Acrobat Pro simultaneously",
        "Centralized Team Administration: Seamlessly assign, reallocate, and track user seats across your organization using the web-based Adobe Admin Console",
        "Native Multi-Language Support: Run applications in preferred regional formats, with extensive support for Multi European Languages (such as French, German, Spanish, Italian, and Dutch)",
        "Creative Cloud Libraries: Share logos, color palettes, images, text styles, and brand assets across the team to maintain absolute brand consistency across projects",
        "AI-Powered Firefly Tools: Leverage advanced, commercially safe generative AI workflows like Generative Fill, Text-to-Vector, and Generative Match directly inside creative workflows",
        "Seamless Cross-App Integration: Move assets effortlessly between vector, raster, video, and audio tools without losing fidelity or requiring time-consuming manual conversions",
        "Enterprise Asset Protection: Retain absolute ownership over company graphics and intellectual property, with options to encrypt data and control asset sharing externally.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Desktop Apps", "Full installation rights to Photoshop, Illustrator, InDesign, Premiere Pro, and more.", "Windows & macOS"],
        ["Adobe Admin Console", "Central IT dashboard used to provision user seats, monitor license compliance, and manage security settings.", "Cloud-Based"],
        ["Creative Cloud Mobile Apps", "Comprehensive access to portable companion apps like Lightroom Mobile, Photoshop for iPad, and Capture.", "iOS & Android"],
        ["Adobe Fonts & Firefly Credits", "Access to a library of over 25,000+ commercial fonts paired with a monthly allotment of Generative AI credits.", "Included"],
        ["1TB Cloud Storage per User", "Expanded cloud-based workspace storage allocated per seat to seamlessly sync and back up massive project files.", "Included"],
        ["Frame.io & Substance 3D Modeler", "Built-in cloud video review tools (Frame.io) alongside standard 3D asset modeling tools.", "Included"],
        ["Advanced Technical Support", "Priority access to 24/7 technical web help and exclusive 1:1 expert consultation sessions with Adobe product experts.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual team member's corporate Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Creative Cloud on up to two separate computers (e.g., office workstation and home design laptop)."],
        ["Single Concurrent Session", "The software apps can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date."],
      ] },
    ],
  },
  "adobe-illustrator": {
    overview:     [
      { type: "p", text: "Adobe Illustrator for Teams is the industry-standard vector graphics software used by professional design teams, branding agencies, and marketing departments worldwide. This specific commercial deployment variant offers full cross-platform compatibility across multiple operating systems, natively supporting English alongside over 20 European languages. Managed via a centralized cloud dashboard, it equips graphic designers with precision typography, advanced color management, and scalable vector tools to create everything from digital logos and icons to massive print packaging and billboards." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Centralized Team Administration: Assign, reallocate, and track user seats dynamically across your creative department using the web-based Adobe Admin Console",
        "Native Multi-Language Support: Work seamlessly in preferred regional layouts, with extensive support for Multi European Languages (such as French, German, Spanish, Italian, and Dutch)",
        "Advanced Vector Engine: Create perfectly scalable artwork using anchor points, precision paths, shape-building tools, and dynamic live corners",
        "AI-Powered Adobe Firefly Tools: Accelerate vector creation with advanced generative AI features like Text to Vector Graphic, Generative Match, and Generative Recolor",
        "Creative Cloud Libraries: Share corporate logos, color palettes, vector shapes, and character styles across the team to lock in absolute brand consistency",
        "Advanced Typography: Access comprehensive open-type properties, variable font formatting, touch type alterations, and automated path-snapping text alignment",
        "Cross-Device Vector Workflows: Start a vector concept on an iPad with a stylus and seamlessly finish the high-fidelity production file on a desktop workstation.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Illustrator Desktop Software", "High-performance vector design software optimized for local system hardware acceleration.", "Windows & macOS"],
        ["Illustrator on iPad", "Fully featured touch-and-stylus vector companion app for mobile and field design.", "iPadOS"],
        ["Adobe Admin Console", "Central IT dashboard used to provision user seats, monitor license compliance, and manage security settings.", "Cloud-Based"],
        ["Adobe Fonts Library", "Instant, unlimited access to over 25,000+ premium commercial typography faces directly inside the application.", "Included"],
        ["Adobe Cloud Storage", "Dedicated cloud space allocated per user seat to support real-time asset syncing across workstations.", "Included"],
        ["Acrobat Web Link Sharing", "Secure generation of interactive review links so clients can view vector mockups without an active license.", "Included"],
        ["Continuous Updates", "Immediate, automatic access to newly released workflow innovations, performance improvements, and file compatibility patches.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual team member's corporate Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Illustrator on up to two separate computers (e.g., office workstation and home laptop)."],
        ["Single Concurrent Session", "The software can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date."],
      ] },
    ],
  },
  "adobe-photoshop": {
    overview:     [
      { type: "p", text: "Adobe Photoshop for Teams is the industry-standard digital imaging, photo editing, and raster graphics software built for professional creative teams, marketing departments, and visual artists. This commercial deployment variant offers full cross-platform compatibility across multiple operating systems, natively supporting English alongside over 20 European languages. Managed via a centralized cloud dashboard, it equips design teams with advanced pixel-level editing, complex compositing tools, and state-of-the-art retouching features to deliver high-impact digital and print visuals." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Centralized Team Administration: Seamlessly assign, reallocate, and track user seats across your department using the web-based Adobe Admin Console",
        "Native Multi-Language Support: Work efficiently in preferred regional layouts, fully supporting Multi European Languages (such as French, German, Spanish, Italian, and Dutch)",
        "AI-Powered Generative Fill: Leverage advanced Adobe Firefly generative AI directly inside the canvas to add, extend, or remove image content using simple text prompts",
        "Advanced Layer Management: Build complex visual composites using non-destructive adjustment layers, blending modes, and precise smart object linking",
        "Precision Selection and Masking: Isolate intricate subjects like hair, fur, or transparent objects instantly with AI-assisted selection engines",
        "Comprehensive Retouching Tools: Remove imperfections, adjust facial expressions, and correct lens distortions effortlessly with content-aware healing and neural filters",
        "Cross-Device Cloud Ecosystem: Start editing a high-resolution canvas on an iPad with a stylus and pick up right where you left off on your office desktop workstation.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Photoshop Desktop Software", "Full production-ready installation package optimized for local GPU acceleration.", "Windows & macOS"],
        ["Photoshop on iPad", "Fully featured touch-and-stylus companion app for mobile designing and editing.", "iPadOS"],
        ["Photoshop on the Web", "Browser-based access to core editing and review tools without installing software.", "Web Browser"],
        ["Adobe Admin Console", "Central IT dashboard used to provision user seats, monitor license compliance, and manage security settings.", "Cloud-Based"],
        ["Adobe Fonts & Adobe Express", "Direct access to thousands of premium commercial fonts paired with a companion subscription to Adobe Express.", "Included"],
        ["Adobe Cloud Storage", "Dedicated cloud space allocated per user seat to support real-time cross-device document syncing.", "Included"],
        ["Continuous Updates", "Immediate, automatic access to newly released workflow innovations, AI feature additions, and security patches.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual team member's corporate Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Photoshop on up to two separate computers (e.g., office workstation and home laptop)."],
        ["Single Concurrent Session", "The software can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date."],
      ] },
    ],
  },
  "adobe-premiere-pro": {
    overview:     [
      { type: "p", text: "Adobe Premiere Pro for Teams is the industry-leading, timeline-based video editing software designed for professional production teams, marketing departments, and content creators. This specific commercial deployment variant offers full cross-platform compatibility across both Windows and macOS, natively supporting English alongside over 20 European languages. Managed via a centralized cloud administrative interface, it equips video editors with premium tools for high-performance editing, color grading, motion graphics, and audio mixing, while facilitating real-time collaboration with other team members." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Centralized Team Administration: Assign, reallocate, and track user seats dynamically across your production team using the web-based Adobe Admin Console",
        "Native Multi-Language Support: Work seamlessly in preferred regional formats, with extensive support for Multi European Languages (such as French, German, Spanish, Italian, and Dutch)",
        "Frame.io for Creative Collaboration: Accelerate review cycles with integrated real-time video review, frame-accurate commenting, and cloud-based media sharing tools",
        "AI-Powered Adobe Sensei Tools: Save time on tedious tasks with features like Text-Based Editing, Auto Reframe for social media formats, Speech-to-Text captions, and Audio Enhancements",
        "Comprehensive Color & Audio: Master footage directly on the timeline using advanced Lumetri Color scopes and professional audio engineering tools via the Essential Sound panel",
        "Native Format Support: Edit everything from mobile footage to 8K, HDR, and virtual reality content without needing time-consuming external transcoding or conversion steps",
        "Dynamic Link Integration: Eliminate rendering lag by jumping seamlessly between Premiere Pro and Adobe After Effects or Adobe Audition without intermediate rendering.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Premiere Pro Desktop Software", "High-performance video editing software optimized for local system acceleration.", "Windows & macOS"],
        ["Adobe Admin Console", "Central IT dashboard used to provision user seats, monitor license compliance, and manage security settings.", "Cloud-Based"],
        ["Frame.io Integration", "Cloud video review platform including 100GB of shared storage and secure collaborator links.", "Standard Component"],
        ["Adobe Fonts & Stock Audio", "Direct access to thousands of curated premium fonts and royalty-free audio tracks inside the app interface.", "Included"],
        ["Adobe Cloud Storage", "Dedicated, high-speed storage allocated per seat to support smooth cloud assets syncing.", "Included"],
        ["Premiere Rush Mobile App", "Lightweight companion video editor for shooting, editing, and sharing clips on mobile platforms.", "iOS & Android"],
        ["Continuous Updates", "Immediate, automatic access to newly released workflow innovations, performance improvements, and device drivers.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual team member's corporate Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Premiere Pro on up to two separate computers (e.g., office workstation and home editing laptop)."],
        ["Single Concurrent Session", "The software can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's VIP program, meaning any seats added mid-cycle are automatically prorated to align with your team's universal anniversary date."],
      ] },
    ],
  },
  "autodesk-build": {
    overview:     [
      { type: "p", text: "Autodesk Build bridges the gap between design and jobsite execution by centralizing communication, data collection, and document tracking. Built on a common data environment, it allows teams to manage day-to-day operations seamlessly from any device. It combines the best of PlanGrid and BIM 360 to deliver standardized forms, real-time quality tracking, and comprehensive cost insights, ensuring your projects finish on time and under budget." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Connected Project Management: Streamline submittals, RFIs, meeting minutes, and daily logs in one shared digital dashboard",
        "Real-Time Field Collaboration: Access up-to-date 2D sheets and 3D BIM data directly on-site via mobile devices",
        "Integrated Cost Control: Track change orders, monitor budgets, and forecast risks dynamically to safeguard profitability",
        "Quality & Safety Tracking: Standardize safety checklists, log punch lists, and track real-time resolution of field issues",
        "Predictive Insights & Reports: Leverage machine learning analytics to identify project risks before they stall construction.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Build Core Module", "Cloud tools for RFIs, submittals, schedules, and daily construction workflows.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system providing a single source of project truth.", "Cloud Platform"],
        ["Cost Management Extension", "Tools to manage cash flow, budgets, contracts, and financial change orders.", "Integrated Utility"],
        ["PlanGrid Mobile App", "Mobile field execution app optimized for fast sheet viewing and offline sync.", "iOS / Android App"],
        ["Insight & Administration", "Central dashboard for member permissions, custom templates, and cross-project reports.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Build 550 Sheet Plan (Commercial)", "Full commercial rights. Grants access to up to 550 active sheets across all active projects. Best for small-to-medium project teams."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows contractors and external vendors to bring their own Build 550 license into a client's hub without utilizing extra host seat allocations."],
      ] },
    ],
  },
  "autodesk-docs": {
    overview:     [
      { type: "p", text: "Autodesk Docs serves as the foundation for the Autodesk Construction Cloud platform, providing a secure, centralized repository for all project data. It eliminates communication silos by allowing teams to review, markup, and approve 2D drawings, 3D models, and standard office documents from any device. Built-in permission controls, version histories, and automated approval workflows ensure that field teams, architects, and owners always collaborate on the correct, most up-to-date information." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Common Data Environment: Centralize all construction files, structural designs, and contracts in a single, secure cloud hub",
        "Advanced 2D/3D Viewer: Preview, pan, zoom, and inspect complex CAD drawings and BIM models directly within your web browser",
        "Markup & Issue Tracking: Layer public or private comments, callouts, and issue pins onto sheets to accelerate clash resolutions",
        "Automated Approval Workflows: Streamline document review cycles with customized multi-step routing, electronic sign-offs, and status tracking",
        "Complete Version Control: Retain a permanent history of document revisions with side-by-side visual comparisons to spot design changes instantly.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Docs Hub", "Cloud platform for advanced file storage, custom folder structures, and attribute tagging.", "Cloud Platform"],
        ["BIM 360 Document Management", "Companion access to legacy BIM 360 environments for older, active project architectures.", "Cloud Platform"],
        ["Autodesk Desktop Connector", "Background utility that syncs your local desktop file explorer directly to cloud project folders.", "Desktop Utility"],
        ["Mobile Access App", "On-the-go sheet viewing, issue tracking, and offline file synchronization for jobsite use.", "iOS / Android App"],
        ["Admin & Security Tools", "Rigorous role-based, company-based, and user-based folder access permission dashboards.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Single-User Commercial License", "Full commercial rights. Grants one dedicated user full cloud access to manage, view, and collaborate on project documents."],
        ["Flexible Term Contracts", "Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows consultants, clients, or subcontractors to bring their own Docs license into a project hub without using the host company's available seat inventory."],
      ] },
    ],
  },
  "autodesk-takeoff": {
    overview:     [
      { type: "p", text: "Autodesk Takeoff streamlines the estimating process by allowing teams to capture project scopes using both 2D drawings and 3D models. Operating within a shared common data environment, it eliminates data silos and ensures that estimators always work off the latest design revision. By automating quantity calculations and linking takeoffs directly to construction documents, it reduces human error, cuts down on rework, and dramatically accelerates the bidding cycle." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Cloud-Based Quantification: Access and perform takeoffs anytime, anywhere, eliminating the need for bulky local software installations",
        "Integrated 2D and 3D Takeoffs: Combine linear, count, and area takeoffs from PDF sheets with automated multi-dimensional takeoffs from 3D models",
        "Custom Classification Systems: Upload and map your standard corporate or regional costing catalogs directly to your quantities",
        "Real-Time Collaboration: Allow multiple estimators to work simultaneously on a single project package without risking duplicated counts",
        "Automated Version Tracking: Receive immediate alerts when design files change, allowing you to instantly view and adjust impacted quantities.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Autodesk Takeoff Module", "Unified workspace for 2D sheet takeoff and 3D model-based quantification.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management system ensuring access to the latest construction documents.", "Cloud Platform"],
        ["Formula Engine Tool", "Tool for creating custom mathematical formulas to automate complex component calculations.", "Integrated Utility"],
        ["Takeoff Viewer & Panel", "Responsive browser-based interface for filtering, auditing, and sorting itemized takeoff outputs.", "Web Browser"],
        ["Insight & Analytics", "Central dashboard for visual reporting, data export, and permission management.", "Cloud Analytics"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted access to both 2D and 3D cloud takeoff workflows for professional estimations."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows external estimators or trade partners to bring their own Takeoff license into a master project hub without drawing down host seat pools."],
      ] },
    ],
  },
  "bim-collaborate": {
    overview:     [
      { type: "p", text: "Autodesk BIM Collaborate allows project teams to share design data, track progress, and coordinate models in a shared common data environment. Operating entirely in the cloud, it helps teams catch design errors and constructability issues early in the preconstruction lifecycle. It aggregates design models from Revit, Civil 3D, and AutoCAD into a single view, automating spatial coordination and providing actionable insights to eliminate costly on-site reworks and communication delays." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Automated Clash Detection: Aggregate multi-discipline models into shared coordination spaces to instantly spot spatial conflicts",
        "Visual Change Analysis: Compare design changes between 3D model iterations side-by-side to understand project impacts instantly",
        "Unified Issue Tracking: Create, assign, and track design issues to resolution using pinned locations directly on 2D sheets and 3D models",
        "Design Timeline & Packages: Control how and when design data is shared with other project teams using formal packaging and tracking streams",
        "Connected Navisworks Workflow: Sync cloud-based issue tracking directly with Navisworks Manage for advanced coordination and deeper field analysis.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["BIM Collaborate Module", "Cloud platform for automated model coordination, clash spaces, and matrix reviews.", "Cloud Platform"],
        ["Design Collaboration Module", "Timeline workspace for managing package handoffs and visual project updates.", "Cloud Platform"],
        ["Autodesk Docs", "Central document management foundation ensuring access to the latest source drawings.", "Cloud Platform"],
        ["BIM 360 Workspace", "Legacy access to older project hubs hosted on the previous BIM 360 platform.", "Cloud Platform"],
        ["Coordination Utilities", "Desktop Connector integration and browser-based 3D multi-model aggregation tools.", "Cloud & Desktop"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants a single user cloud access to automated clash matrices, change reviews, and issue tracking."],
        ["Flexible Term Contracts", "Available as an electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Bring Your Own Subscription (BYOS)", "Allows external consultants, structural engineers, or contractors to bring their own license into a client's hub without utilizing extra host seat allocations."],
      ] },
    ],
  },
  "bim-collaborate-pro": {
    overview:     [
      { type: "p", text: "( 10, 25,50,100,500,1000)" },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "See product overview for capabilities.",
      ] },
    ],
    whatsIncluded:     [
      { type: "p", text: "See the overview and key features for included components." },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Contact Aptus for subscription and licensing options for this product.", ""],
      ] },
    ],
  },
  "copilot-for-microsoft-365": {
    overview:     [
      { type: "p", text: "Copilot for Microsoft 365 is an enterprise-grade, AI-powered productivity engine that integrates large language models (LLMs) with your organization's data inside the Microsoft 365 apps. Operating natively behind your tenant's security perimeter, it surfaces insights, drafts content, and automates complex workflows by safely parsing your emails, chats, meetings, and documents. This solution transforms natural language prompts into actionable assets across the entire Office suite, drastically reducing the time spent on administrative tasks while maintaining strict corporate data compliance." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Context-Aware Intelligence: Generates highly relevant responses by securely scanning your corporate data ecosystem (emails, files, chats) via the Microsoft Graph",
        "Automated Meeting Synthesis: Summarizes live Microsoft Teams meetings in real time, capturing key discussion points, contrasting opinions, and action items without recording audio",
        "Instant Content Drafting: Generates multi-page document drafts in Word, crafts email responses in Outlook, and builds structured presentations in PowerPoint from plain text prompts",
        "Advanced Data Analysis: Analyzes massive Excel data sets, writes formulas, isolates statistical anomalies, and generates interactive data visualizations instantly",
        "Enterprise Data Protection: Guarantees absolute data privacy, ensuring your company's intellectual property and prompts are never used to train public models",
        "Cross-App Communication (Business Chat): Acts as a central AI coordinator across all your workplace apps to track down specific files, timeline updates, or project milestones",
        "Extensible Architecture: Integrates seamlessly with third-party software, internal databases, and lines of business using custom Copilot Studio plugins.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate cloud identity rather than a specific physical machine."],
        ["Prerequisite License Enforcement", "Requires an active underlying base enterprise license assigned to the same user profile (such as Microsoft 365 E3/E5, Office 365 E3/E5, or Business Basic/Standard/Premium)."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically based on organizational changes."],
        ["Flexible Mid-Term Scalability", "Available as a standalone user add-on with no minimum seat requirements, allowing organizations to pilot deployment scales freely."],
        ["No Maximum User Caps", "Designed to scale flawlessly from small business tenants up to massive multi-national corporations, supporting an unlimited number of seats."],
      ] },
    ],
  },
  "creative-cloud-enterprise": {
    overview:     [
      { type: "p", text: "Adobe Creative Cloud for Enterprise with Feature Restricted Licensing (FRL) - Isolated is a highly secure deployment model engineered strictly for high-security, air-gapped environments. This product features Multiple Platforms (MLP) and Multi European Languages (MEL) support, making it ideal for multinational entities operating under strict regulatory constraints. Tailored for government agencies, defense contractors, and research labs, the Isolated Activation mechanism requires absolutely zero internet connectivity. This guarantees that secure workstations can run professional creative desktop applications locally without ever checking in with Adobe's online authentication servers or sending outbound telemetry data. Adobe Creative Cloud for Enterprise with Feature Restricted Licensing (FRL) - Online is a highly secure, controlled deployment model engineered specifically for organizations that maintain strict internal firewall restrictions but allow outbound internet access. This product features Multiple Platforms (MLP) and Multi European Languages (MEL) support, making it ideal for multinational entities, financial institutions, and government agencies operating under rigid compliance frameworks. The Online Activation mechanism allows physical workstations to validate their software license directly through a secure, restricted connection to Adobe's authentication servers. This setup delivers desktop software verification while systematically blocking individual user cloud features like personal cloud storage and public asset sharing." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Air-Gapped Isolated Activation: Install and license applications locally via self-contained packages without any internet connection",
        "Zero Telemetry or Data Leakage: The software functions autonomously, ensuring no compliance logs or usage metrics are transmitted back to Adobe",
        "Complete Desktop App Suite: Deploy over 20+ flagship applications locally, including Photoshop, Illustrator, InDesign, Premiere Pro, and Acrobat Pro",
        "No Adobe ID Dependency: Eliminates the requirement for individual user sign-ins, removing the risk associated with web-based credential tracking",
        "Machine-Specific Security: Licenses are generated using machine-specific unique activation codes to maintain strict structural asset control",
        "Central Offline Packaging: IT Admins create entirely offline, redistributable installers via the secure web-based Adobe Admin Console",
        "Multi-Language OS Locale Sync: Packages can inherit the host computer's operating system language automatically, supporting localized deployments across Europe",
        "Restricted Online Authentication: Workstations connect securely to Adobe's licensing servers for instantaneous activation without requiring individual user logins",
        "No User Identity Dependency: Eliminates the need for personal Adobe IDs or Federated Single Sign-On (SSO) credentials, streamlining IT deployment",
        "Controlled Network Perimeter: Designed to work behind strict corporate proxies, restricting outbound communication solely to essential licensing endpoints",
        "Device-Locked Security: Licenses are tied directly to the unique physical workstation configuration, ensuring the software cannot be extracted or run on unauthorized machines",
        "Central Enterprise Packaging: IT Administrators can build, configure, and customize automated silent deployment packages via the web-based Adobe Admin Console",
        "Multi-Language OS Locale Sync: Packages inherit or adapt to the host computer's operating system language automatically, fully supporting localized deployments across Europe.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Desktop Apps", "Local installation binaries for Photoshop, Illustrator, Premiere Pro, InDesign, and more.", "Windows & macOS"],
        ["Offline Activation Mechanism", "Pre-validated configuration files that lock the core license directly to the physical system.", "Standard Component"],
        ["Adobe Admin Console (Packaging)", "Internet-connected portal used exclusively by IT admins to generate secure offline installer packages.", "Cloud-Based (Admin Only)"],
        ["Local Device Support", "Complete authorization to run full-scale creative workflows entirely within an offline intranet.", "Included"],
        ["Enterprise Technical Support", "Priority 24/7 IT admin assistance for handling complex packaging and network-isolated configurations.", "Included"],
        ["Adobe Cloud Services & Storage", "Cloud-dependent features, font syncing, libraries, and cloud storage allocation.", "Restricted / Disabled"],
        ["Generative AI Web Features", "Live web-reliant cloud features like real-time text-to-image Generation (Adobe Firefly).", "Restricted / Disabled"],
        ["What's Included", "Flagship Desktop Apps", "Local installation packages for Photoshop, Illustrator, Premiere Pro, InDesign, and more."],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Device-Restricted Allocation", "Licenses are strictly mapped to individual, physical workstations using machine-specific validation codes."],
        ["Complete Cloud Isolation", "All web-dependent cloud storage, font libraries, and collaborative features remain permanently deactivated to satisfy air-gapped security."],
        ["Per-Machine Execution", "One license seat allows the active, unrestricted operation of the creative suite on one designated physical machine."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's enterprise VIP framework, ensuring any security licenses added mid-term are prorated to match your organization's universal anniversary date."],
        ["______________________________________________________________________________Product Title", "Creative Cloud for enterprise All Apps ALL Multiple Platforms Multi European Languages Feature Restricted Licensing Subscription Online (Level 1 ,2 and 3)"],
        ["Subscription & Licensing Options", ""],
        ["Device-Based Online Allocation", "Every license seat is tied permanently to a unique, physical workstation using machine-specific data validated via a secure network link."],
        ["Feature-Restricted Privacy", "All non-essential web-dependent features, individual cloud storage spaces, and asset sharing panels remain permanently locked down to satisfy security compliance."],
        ["Per-Machine Execution", "One license seat allows the active, continuous operation of the creative suite on one designated physical machine."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's enterprise VIP framework, ensuring any security licenses added mid-term are prorated to match your organization's universal anniversary date."],
      ] },
    ],
  },
  "creative-cloud-enterprise-hed": {
    overview:     [
      { type: "p", text: "Adobe Creative Cloud for Enterprise All Apps for Higher Education (HED) is a specialized deployment model engineered specifically for university computer labs, multimedia classrooms, and campus library workstations. These specific variant features Multiple Platforms (MLP) and Multi European Languages (MEL) support, tailored for multilingual university environments. Unlike standard corporate or individual licenses, this Shared Device Education License (SDL) shifts the licensing rights from the individual person to the physical workstation. This allows any number of students, faculty, or researchers to access the complete suite of creative applications on a shared machine simply by logging in with their institutional credentials." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Per-Workstation Licensing: Software is licensed to the physical machine, making it ideal for high-traffic campus labs, design studios, and testing centers",
        "Unlimited User Access: An infinite number of students and faculty can utilize a single licensed workstation sequentially throughout the academic semester",
        "Complete Suite of 20+ Apps: Grants deployment rights to all flagship apps simultaneously, including Photoshop, Illustrator, InDesign, Premiere Pro, and Acrobat Pro",
        "Higher Education Integration: Built specifically to align with HED security, data privacy policies, and advanced academic IT infrastructures",
        "Federated ID & Single Sign-On (SSO): Integrates with campus identity providers (such as Azure AD/Entra ID, Okta, or Google Workspace) for secure, instantaneous login",
        "Enterprise-Level IT Management: Package, deploy, and update applications across hundreds of machines simultaneously using the centralized Adobe Admin Console",
        "Lab-Safe Generative AI: Access Adobe Firefly features with institutional guardrails that keep student content securely partitioned and compliant with school data rules.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Full Desktop Application Suite", "Complete enterprise installation rights for Photoshop, Illustrator, Premiere Pro, After Effects, and more.", "Windows & macOS"],
        ["Adobe Admin Console", "Central IT dashboard used to build deployment packages, monitor lab compliance, and track machine status.", "Cloud-Based"],
        ["Self-Service Lab Packages", "Access to pre-configured or fully customizable automated installer packages for silent network deployments.", "Included"],
        ["Shared Device Access Control", "Cloud authentication profile engine that validates users instantly upon machine login.", "Standard Component"],
        ["Adobe Fonts Library", "Full access to over 25,000+ commercial and academic typography families directly inside the applications.", "Included"],
        ["Adobe Education Exchange", "Free institutional access to thousands of ready-made syllabi, interactive tutorials, and academic workshops.", "Included"],
        ["Enterprise Technical Support", "Priority 24/7 IT assistance, expert deployment consultation web sessions, and advanced troubleshooting support.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Device-Based Allocation", "Every license seat is tied permanently to a unique, physical workstation rather than an individual person's identity."],
        ["Lab and Classroom Deployment", "Intended strictly for open-access computers, classroom desks, and localized hardware labs housed on physical university premises."],
        ["Concurrent Workstation Limit", "One license seat allows the active, concurrent operation of the Creative Cloud suite on one specific physical machine."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's enterprise academic VIP program, ensuring any device licenses added mid-semester are automatically prorated to align with the school's universal anniversary date."],
      ] },
    ],
  },
  "creative-cloud-teams-education": {
    overview:     [
      { type: "p", text: "Adobe Creative Cloud for Teams All Apps for Education is a comprehensive digital creativity platform tailored specifically for accredited primary, secondary, and higher education institutions. This specific deployment variant features Multiple Platforms (MLP) and Multi European Languages (MEL) support, making it perfectly suited for multilingual campuses and cross-platform computer labs. Managed via a single administrative dashboard, this tier provides students, faculty, and administrative staff with the complete suite of industry-standard creative applications required to develop digital literacy, drive interactive learning, and build professional-grade portfolios" },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Institutional Compliance & Pricing: Access heavily discounted academic rates restricted exclusively to qualified educational institutions, schools, and universities",
        "Complete Suite of 20+ Apps: Deploy flagship creative tools simultaneously, including Photoshop, Illustrator, InDesign, Premiere Pro, and Acrobat Pro",
        "Centralized Campus IT Control: Seamlessly deploy software packages, track compliance, and reassign seats when students graduate or change courses via the Adobe Admin Console",
        "Cross-Platform & Multilingual Deployments: Install seamlessly across Windows and macOS workstations, fully supporting Multi European Languages (such as English, French, German, Spanish, and Italian)",
        "AI in Education (Adobe Firefly): Access ethically trained generative AI tools featuring built-in enterprise content guardrails designed to protect student work and institutional compliance",
        "Shared Creative Cloud Libraries: Allow educators to distribute brand assets, syllabi templates, graphics, and color palettes directly to student workspaces",
        "Collaborative Group Classrooms: Leverage integrated review systems like Frame.io to facilitate real-time peer feedback, critique sessions, and digital portfolio grading.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Flagship Desktop Apps", "Full institutional installation rights for Photoshop, Illustrator, Premiere Pro, and more.", "Windows & macOS"],
        ["Adobe Admin Console", "Central IT dashboard for managing educational domains, provisioning seats, and tracking usage metrics.", "Cloud-Based"],
        ["Mobile & iPad Companion Apps", "Mobile access to specialized education apps like Lightroom Mobile, Photoshop for iPad, and Adobe Express.", "iOS & Android"],
        ["Adobe Fonts & Assets", "Complete classroom access to a curated library of over 25,000+ fonts cleared for educational use.", "Included"],
        ["Institutional Cloud Storage", "Dedicated cloud space per seat to backup classroom assignments and sync projects across lab computers.", "Included"],
        ["Adobe Education Exchange", "Free access to professional development courses, peer-led workshops, and thousands of ready-made lesson plans.", "Included"],
        ["Advanced Academic Support", "Priority IT web assistance paired with 1:1 expert consultation sessions to optimize campus software deployments.", "Included"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual student's or staff member's institutional email/Adobe ID."],
        ["Multi-Device Installation", "A named user can install and log into Creative Cloud on up to two separate computers (e.g., a campus lab computer and a personal study laptop)."],
        ["Single Concurrent Session", "The software applications can only be actively used on one device at any given time per license."],
        ["Adobe Value Incentive Plan (VIP)", "Managed via Adobe's academic VIP program, ensuring any seats added mid-semester are automatically prorated to align with the school's universal anniversary date."],
      ] },
    ],
  },
  "exchange-online-kiosk": {
    overview:     [
      { type: "p", text: "Microsoft Exchange Online Kiosk is an entry-level, cloud-based business email solution designed specifically for frontline, shift, or deskless workers who do not have dedicated workstations. It provides a secure, cost-effective way for users—such as retail associates, manufacturing staff, or field technicians—to stay connected with company communications via web browsers or mobile devices. This plan delivers essential messaging, calendaring, and contact management infrastructure backed by enterprise-grade security, without the overhead of unused premium cloud apps." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Frontline Messaging Core: Access corporate email securely from any shared or public computer via a streamlined web interface",
        "Essential Mailbox Capacity: Equip shift and deskless workers with a dedicated 2GB cloud mailbox space tailored for baseline operational communications",
        "Shared Calendar Coordination: Schedule shifts, view team availability, and coordinate company-wide announcements seamlessly across the organization",
        "Global Address List (GAL): Browse the complete corporate directory instantly to locate team members, departments, and store locations",
        "Enterprise Anti-Malware Protection: Filter out spam, phishing attempts, and known malware strains automatically using Exchange Online Protection (EOP)",
        "Outlook Web Access Optimization: Deliver a fast, responsive user interface specifically optimized for low-bandwidth connections and mobile web browsers",
        "Basic Mobile Connectivity: Sync corporate emails, folder structures, and contacts directly to personal or corporate smartphones.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Autodesk Fabrication CAMduct enables mechanical, electrical, and plumbing (MEP) contractors to transition seamlessly from design models to shop floor production. It combines an extensive library of parametric sheet metal components with advanced nesting algorithms to maximize material efficiency and reduce scrap. By generating precise machine-specific NC code directly from fabrication models, it ensures consistent sheet metal manufacturing, accurate cost tracking, and streamlined delivery to the jobsite." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Comprehensive Component Library: Access a massive database of parametric rectangular, round, and oval ductwork specifications",
        "Advanced Material Nesting: Utilize powerful automatic nesting algorithms to maximize sheet utilization and minimize material waste",
        "Direct CNC Machine Drivers: Generate tailored NC code to directly drive specialized sheet metal cutters, plasma burners, and coil lines",
        "Barcoding & Tracking: Print custom tracking labels with barcodes to track components from assembly to jobsite installation",
        "Integrated Cost Estimating: Calculate reliable material, labor, and production costs dynamically based on custom shop parameters.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Fabrication CAMduct Core", "Desktop application for sheet metal manufacturing, nesting, and machine tooling.", "Local Installation"],
        ["CAMduct Components Library", "Shared parametric database for Imperial and Metric ductwork configurations.", "Local / Network Shared"],
        ["Post-Processors & Drivers", "Built-in translator tools to format files for a wide variety of CNC equipment.", "Local Utility"],
        ["Tracker & Label Utilities", "Auxiliary tools to format, customize, and print production barcodes.", "Local Utility"],
        ["Autodesk Desktop App", "Central hub for software updates, manufacturing patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted use for active sheet metal shops and corporate manufacturing pipelines."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Multi-User Migration Options", "Available under modern named-user standard plans, replacing older legacy perpetual network licenses."],
      ] },
    ],
  },
  "infodrainage": {
    overview:     [
      { type: "p", text: "Accelerate your sustainable stormwater design workflow and streamline regulatory approvals from day one. The InfoDrainage Commercial Master Bundle is a production-ready model template and asset library engineered specifically for multi-story corporate, retail, industrial, and mixed-use land development projects. It eliminates hours of repetitive drainage setup, bringing immediate Autodesk InfoDrainage standardization and sustainable design compliance to your civil engineering practice. [1, 2]" },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Advanced BIM & Civil 3D Integration: Seamless round-tripping structures and surface data with Civil 3D to eliminate manual entry errors",
        "Pre-Configured Regional Deluge Templates: Built-in rainfall curves and Huff distribution distributions tailored to regional commercial standards. [1] SuDS & LID Component Templates: Instantly size parametric rain gardens, bioretention cells, permeable pavements, and infiltration trenches",
        "Automated Hydraulic Sizing Wizards: Smart algorithms optimize pipe sizes, pipe gradients, and online storage structures to prevent site flooding",
        "Compliance Report Generation: Pre-formatted layout reports mapped to regulatory agency requirements for instant print-to-PDF submission. [1]",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Model Template", "1x Master Commercial Template with pre-set runoff methods, routing criteria, and boundary conditions", ".iddx (InfoDrainage 2024–2026+)"],
        ["SuDS & Structure Library", "50+ Custom inlet/outlet structures, proprietary stormwater filters, weir structures, and smart orifices", ".idlx (Fully Parametric)"],
        ["Rainfall & Deluge Data", "Global NOAA Atlas 14, NRCS, and standard synthetic storm profiles pre-loaded into the rainfall manager", "Pre-built in template"],
        ["Analysis Smart Reports", "5x Regulatory compliance reporting layouts covering pipe audits, hydraulic grade lines, and critical storm paths", "Pre-loaded"],
        ["Implementation Manual", "35-page digital implementation guide covering catchments, utility collision checks, and Civil 3D workflows", ".pdf Digital Download"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Single-User License", "1 user, up to 2 active workstations, and 12 months of free version updates for freelance civil engineers."],
        ["Team Design License", "Up to 10 users, shared network library deployment, 24 months of updates, and priority technical support."],
        ["Enterprise License", "Unlimited users across a corporate domain, floating network licensing, lifetime updates, and custom API onboarding"],
      ] },
    ],
  },
  "infowater-pro": {
    overview:     [
      { type: "p", text: "Autodesk InfoWater Pro is a GIS-native desktop hydraulic modeling software that runs directly inside Esri ArcGIS Pro. Built for water utility engineers and consulting firms, it delivers a one-to-one data alignment between geographic information system (GIS) layers and the hydraulic model. The software leverages the industry-standard EPANET engine to simulate countless \"what-if\" scenarios. This allows operators to accurately plan, design, and manage resilient water distribution networks without maintaining separate, detached modeling databases." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "ArcGIS Pro Integration: Build, edit, and analyze hydraulic networks within a single geospatial environment",
        "Criticality Assessment: Identify vulnerable valves and pipe segments to quickly assess isolation and failure impacts",
        "Advanced Water Quality: Track water age, source tracing, and multi-species chemical interactions dynamically",
        "Unidirectional Flushing (UDF): Optimize system cleaning plans by simulating the necessary valve closures and target velocities",
        "Transient Analysis: Simulate pressure surges and water hammer effects to shield physical infrastructure from ruptures",
        "Automated Demand Allocation: Extract customer consumption from meter data or polygons directly onto network nodes",
        "ArcGIS Online Publishing: Share live model insights, 3D visualizations, and interactive maps seamlessly with external stakeholders.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Autodesk InfoWorks ICM Standard (officially designated as InfoWorks ICM Sewer in recent versions) is an advanced integrated catchment modeling software optimized for wastewater and sanitary sewer networks. It enables engineering firms and utility operators to build exceptionally fast, accurate, and collaborative hydraulic models of complex subsurface pipe infrastructure. By delivering unlimited 1D modeling capabilities, it serves as a central source of truth for capacity planning, system expansion analysis, and regulatory compliance without requiring a separate geographic information system (GIS) interface." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Unlimited 1D Modeling: Simulate complex sanitary sewer, combined sewer, and riverine networks with zero cap on network nodes",
        "Dual-Engine Simulation: Run native, highly stable hydraulic computations using either the standard SWMM5 engine or the proprietary, dynamic time-step ICM SIM engine",
        "Integrated Catchment Hydrology: Leverage over 15 distinct hydrologic routing models to compute domestic flows, infiltration, and rainfall runoff",
        "Live Database Lifecycle Tracking: Keep an immutable audit trail using a built-in commit history to trace changes, resolve multi-user conflicts, and roll back edits",
        "Cloud Computing: Push computationally heavy simulations straight to the cloud to significantly increase calculation speed and free up local workstation resources",
        "Scenario Management: Construct and simulate dozens of concurrent \"what-if\" planning scenarios simultaneously within a unified environment",
        "Civil 3D Integration: Seamlessly round-trip infrastructure designs between Autodesk Civil 3D and InfoWorks ICM for continuous hydraulic validation.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Autodesk InfoWorks ICM Ultimate is the premier integrated catchment modeling platform designed for advanced storm, sanitary, and river system simulations. Built for tier-one engineering firms, flood authorities, and major water utilities, it delivers a fully integrated, simultaneous 1D and 2D hydraulic engine. The software allows engineers to accurately model complex subsurface pipe networks alongside overland urban and riverine floodplains within a single, highly collaborative workspace. By utilizing high-performance GPU-accelerated computing, it resolves complex, large-scale flood risk scenarios rapidly and accurately." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Integrated 1D/2D Simulation Engine: Dynamically links subsurface sewer networks (1D) with complex surface topography (2D) to simulate realistic water movement and urban flooding",
        "GPU-Accelerated 2D Mesh Computations: Leverages local graphics cards or cloud resources to execute millions of surface flow calculations exponentially faster than CPU-only processing",
        "Flexible 2D Mesh Generation: Creates custom triangular mesh zones with variable resolutions to capture intricate structural details like roads, buildings, and flood defense walls",
        "Comprehensive River and Floodplain Modeling: Simulates open channels, bridges, culverts, weirs, and complex tidal boundaries alongside stormwater runoff",
        "Multi-User Master Database Architecture: Enables large, distributed teams to work concurrently on the same regional model with built-in version control and conflict resolution",
        "Advanced Remote Cloud Simulation: Offloads massive, multi-scenario 2D runs to Autodesk’s cloud servers to instantly free up local engineering workstations",
        "Automated Spatial Data Import: Directly ingests high-resolution LiDAR data, GIS layers, and CAD files to rapidly build and refresh terrain models.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Autodesk InfoWorks WS Pro is an enterprise-level, standalone hydraulic modeling platform built to plan, design, and operate highly accurate clean water distribution networks. Unlike GIS-dependent applications, InfoWorks WS Pro uses a centralized master database architecture that allows large, multi-disciplinary engineering teams to collaborate on the same regional network model simultaneously. It enables utilities to build complex, standalone digital twins, connect directly to live telemetry, and execute heavy multi-core or cloud simulations to evaluate system performance and protect water quality." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Multi-User Collaborative Database: Enables multiple modeling engineers to access and edit the exact same model simultaneously, complete with built-in version control and conflict resolution",
        "Live Telemetry Integration: Connects directly to external SCADA or telemetry data streams to automate demand area calibrations, assess system leakage, and analyze real-time network behavior",
        "Advanced Ruby Script Automation: Automates highly repetitive workflows, cleanups, and complex data imports from external systems using a built-in Ruby scripting environment",
        "Comprehensive System Analytics: Simulates advanced water quality parameters (such as multi-species chlorination decays and water age), fire flow capacities, and unidirectional main flushing programs",
        "Realistic Operational Modeling: Recreates true-to-life utility operations by explicitly modeling hydrants, localized meters, complex valve curves, and variable-speed pump control policies",
        "Integrated Surge & Transient Analysis: Simulates pressure surges, pipe bursts, and water hammer events natively to evaluate asset resilience against physical structural failures",
        "Multi-Scenario EPANET Importer: Ingests multiple third-party .inp network configurations concurrently into a single model folder to rapidly convert legacy data sets into functional operational scenarios.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Autodesk InfraWorks transforms the preconstruction phase by allowing teams to generate massive, data-rich 3D models of existing environments using real-world GIS data, satellite imagery, and point clouds. It bridges the gap between planning and detailed design by connecting directly to Autodesk Civil 3D and Revit pipelines. By running preliminary traffic, flood, and structural simulations within a visually stunning 3D landscape, it enables stakeholders to evaluate design alternatives, minimize project risks, and make faster, data-driven decisions." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Real-World Context Modeling: Aggregate vast amounts of GIS, BIM, and reality capture data to generate highly accurate 3D city or regional models",
        "Parametric Civil Design: Sketch out conceptually detailed roads, multi-girder bridges, tunnels, and complex drainage networks using rule-based parameters",
        "Environmental & Traffic Simulation: Run built-in visual simulations for vehicle traffic flow, terrain mobility, and line-of-sight analyses",
        "Seamless Civil 3D/Revit Pipelines: Pass conceptual models directly to Civil 3D for detailed grading or to Revit for structural detailing without data loss",
        "High-Fidelity Visual Presentations: Generate photorealistic renderings and fly-through animations to easily communicate project intent to public and private stakeholders.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["InfraWorks Core Software", "Desktop application for conceptual civil modeling, site planning, and simulation.", "Local Installation"],
        ["Model Builder Utility", "Cloud-powered service that automatically builds 3D environments using global open-source maps and GIS data.", "Integrated Cloud Service"],
        ["Autodesk Docs Integration", "Cloud-hosted document management access to publish, share, and collaborate on infrastructure models.", "Cloud Platform"],
        ["Component Libraries", "Extensive database of parametric road parts, bridge structures, street furniture, and vegetation models.", "Local / Network Shared"],
        ["Autodesk Desktop App", "Central hub for software updates, performance patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for engineering firms, municipalities, and professional infrastructure consultants."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Compatible with Autodesk's token system, allowing occasional users or external contractors to consume tokens only on the days the software is active."],
      ] },
    ],
  },
  "inventor-professional": {
    overview:     [
      { type: "p", text: "Autodesk Inventor Professional provides a complete set of design and engineering tools for 3D mechanical design, simulation, visualization, and documentation. It enables engineering teams to create accurate 3D digital prototypes of complex machinery, consumer products, and industrial systems before fabrication. By integrating parametric, direct, and freeform modeling tools alongside advanced stress analysis and kinematic simulation, Inventor helps manufacturers reduce physical prototyping costs, minimize design errors, and streamline the transition from concept to the factory floor." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Professional-Grade 3D Modeling: Design complex parts and massive mechanical assemblies using flexible parametric, direct, and freeform modeling tools",
        "Integrated Shape Optimization: Leverage generative design utilities to optimize components for weight reduction and structural integrity based on real-world constraints Advanced Simulation & FEA: Conduct integrated stress analysis, modal analysis, and kinematic simulations to evaluate product performance before manufacturing",
        "Automated Tube, Pipe, & Cable Routing: Accelerate the design of complex hydraulic runs, rigid piping networks, and electrical wire harnesses with rule-based routing tools",
        "Model-Based Definition (MBD): Embed 3D manufacturing dimensions, geometric tolerances (GD&T), and critical annotations directly into the 3D model for downstream production.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Inventor Professional Core", "Desktop application for 3D part modeling, assembly design, sheet metal, and detailing.", "Local Installation"],
        ["Standard Content Center", "Comprehensive cloud/local library of millions of standard components, fasteners, and steel shapes.", "Local / Network Shared"],
        ["Integrated FEA & Motion Simulation", "Finite Element Analysis and dynamic simulation tools for evaluating structural and mechanical loads.", "Local Plugin"],
        ["Autodesk Vault Basic", "Data management tool for tracking design histories, managing file relationships, and controlling revisions.", "Local / Server App"],
        ["Autodesk Docs & Shared Views", "Cloud-based collaboration tools to publish, review, and mark up 3D designs with clients or shop floors.", "Cloud Platform"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for manufacturing enterprises, engineering firms, and product design consultants."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Compatible with Autodesk's token system, allowing occasional engineers, external contractors, or toolmakers to consume tokens only on the active days of use."],
      ] },
    ],
  },
  "microsoft-365-apps": {
    overview:     [
      { type: "p", text: "Microsoft 365 Apps for Business is a premium, desktop-focused productivity suite designed for small to medium-sized businesses that require advanced offline document editing and file storage without cloud-hosted email servers or collaboration platforms. Operating under Microsoft's New Commerce Experience (NCE) framework, it delivers always-updated, locally installable versions of core Office applications paired with secure cloud backup. This subscription serves as a powerful solution for organizations that prefer to handle their business email elsewhere (such as legacy local servers or third-party hosts) but need top-tier processing power and analytical tools on their physical devices." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Premium Desktop Office Suite: Install and run high-performance, offline versions of Word, Excel, PowerPoint, Outlook, and OneNote locally",
        "Advanced Data Analysis: Leverage full local processing power in Excel to execute complex pivot tables, advanced array formulas, and automated macros",
        "Expansive Cloud Workspaces: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring advanced file synchronization and remote access",
        "Non-Destructive Version History: Protect business assets from accidental overwrites or data loss with automated real-time cloud backups and document version restorations",
        "Professional Layout Creation: Access Microsoft Publisher locally to build custom structural layout templates, marketing flyers, and product packaging drafts (Windows PC only)",
        "Database Management Tools: Utilize Microsoft Access on local workstations to design, configure, and maintain standalone relational business databases (Windows PC only)",
        "Cross-Device Continuity: Open a presentation on your phone, make quick adjustments on a tablet, and finalize the high-fidelity design back on your office desktop workstation.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["Strict 300-Seat Cap", "This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (Microsoft 365 Apps for Enterprise)"],
      ] },
    ],
  },
  "microsoft-365-business": {
    overview:     [
      { type: "p", text: "Microsoft 365 Business Standard is the definitive productivity and collaboration suite tailored specifically for small to medium-sized businesses. Operating under Microsoft's New Commerce Experience (NCE) framework, it combines premium, locally installable desktop applications with enterprise-grade cloud communication services. This subscription serves as a unified digital workspace, allowing teams to manage custom business emails, conduct high-capacity virtual meetings, and securely collaborate on shared files from any location or device." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Premium Desktop Office Suite: Install and execute high-performance, offline versions of Word, Excel, PowerPoint, Outlook, and OneNote",
        "Intelligent Business Email: Establish absolute brand credibility by running custom domain emails (e.g., name@yourcompany.com) powered by an underlying Exchange backend",
        "Unified Collaboration Hub: Coordinate team operations with Microsoft Teams for high-definition video conferencing, persistent group chat, and shared channel spaces",
        "Expansive Cloud Workspaces: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring advanced file synchronization and remote access",
        "Streamlined Client Scheduling: Automate appointment management, client scheduling, and staff calendars using integrated Microsoft Bookings software",
        "Ethical AI Chat Experience: Leverage Microsoft Copilot with web grounding to access writing assistance, rapid data summaries, and protected information parsing",
        "Database Management Tools: Access Microsoft Access and Microsoft Publisher locally to build custom structural layout templates and standalone databases (Windows PC only).",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual user's corporate identity rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user can install and run the premium desktop applications concurrently on up to five PCs or Macs, five tablets, and five mobile platforms."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["Strict 300-Seat Cap", "This SMB tier enforces a maximum limit of 300 total seats across the corporate tenant. Organizations exceeding 300 seats must scale up to Enterprise tiers (E3/E5)."],
      ] },
    ],
  },
  "microsoft-365-business-basic": {
    overview:     [
      { type: "p", text: "Microsoft 365 Business Basic is an agile, cloud-first productivity and collaboration suite designed to provide growing businesses with essential remote work tools. Operating under Microsoft's New Commerce Experience (NCE) framework, it shifts the workspace entirely to the cloud, using web browsers and mobile apps instead of local desktop installations. This cost-effective subscription gives teams business-class email, enterprise-grade video conferencing, and secure cloud storage, making it ideal for frontline personnel, remote staff, and startups." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Web-First Productivity: Create, edit, and co-author files simultaneously using real-time, browser-optimized versions of Word, Excel, PowerPoint, and OneNote",
        "Intelligent Business Email: Build company credibility with a 50GB professional email inbox per user profile, utilizing your own custom domain name",
        "Unified Collaboration Hub: Host virtual video or audio meetings for up to 300 participants, manage chat channels, and share files natively inside Microsoft Teams",
        "Expansive Cloud Storage: Furnish every individual seat with 1TB of secure personal OneDrive cloud storage featuring automatic file backup and file-version recovery",
        "Centralized Team Intranets: Build secure, department-wide internal portals, news feeds, and structured team document repositories using SharePoint Online",
        "Ethical AI Chat Integration: Access Microsoft Copilot with web grounding through any browser to summarize long documents and gather data securely",
        "Automated Data Gathering: Design professional feedback surveys, operational questionnaires, and simple employee timesheets instantly with Microsoft Forms.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft 365 E3 is a comprehensive, cloud-first enterprise platform that integrates industry-leading productivity apps with advanced security and device management capabilities. Built for mid-to-large-scale organizations and enterprise environments, it combines the Office 365 suite with the Windows enterprise operating system and the Enterprise Mobility + Security (EMS) framework. This subscription enables distributed teams to collaborate securely in real time, automates device enrollment, and establishes robust corporate compliance baselines to safeguard business data across all endpoints." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Flagship Enterprise Productivity: Deploy full, locally installable versions of premium apps including Word, Excel, PowerPoint, Outlook, and OneNote",
        "Unified Collaboration Hub: Coordinate team efforts with Microsoft Teams for enterprise chat, video conferencing, channel communication, and cloud-shared workspaces",
        "Enterprise Mobility + Security (EMS E3): Protect corporate assets with identity-driven security features like Conditional Access and Azure Active Directory (Microsoft Entra ID) P1",
        "Unified Endpoint Management: Automate application deployment and manage corporate and personal devices via Microsoft Intune and Windows Autopilot",
        "Advanced Information Protection: Classify, label, and protect sensitive emails and files automatically using data loss prevention (DLP) policies",
        "Core eDiscovery & Compliance: Execute content searches, mailbox holds, and basic legal retention schedules across your entire cloud organization",
        "Enterprise Cloud Email & Storage: Equip each user seat with a business-class 100GB exchange mailbox and expandable cloud storage infrastructure.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Defender for Office 365 (Plan 1) is a cloud-based email and collaboration security service designed to protect organizations against advanced, sophisticated threats. It acts as an intelligent security layer that extends the baseline protections of Exchange Online Protection (EOP). By leveraging global threat intelligence and sandboxing technologies, Plan 1 proactively shields corporate networks from high-risk vulnerabilities, including zero-day malware, malicious links, business email compromise (BEC), and credential phishing across email, SharePoint, OneDrive, and Microsoft Teams." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Safe Attachments Sandboxing: Analyzes unfamiliar email attachments in a secure virtual environment to detect and detonate zero-day malware before delivery",
        "Safe Links Time-of-Click Verification: Scans and verifies web links (URLs) in real time when a user clicks them, protecting endpoints even if the destination page was weaponized after the email arrived",
        "Anti-Phishing and Impersonation Defense: Uses machine learning models to detect email spoofing and prevent attackers from impersonating key executives or trusted brand domains",
        "Collaboration App Protection: Extends enterprise security perimeters beyond email to block malicious files inside SharePoint Online, OneDrive for Business, and Microsoft Teams channels",
        "Real-Time Detections Dashboard: Equips security teams with a unified administrative panel to monitor, filter, and review ongoing malware and phishing attempts across the tenant",
        "Threat Explorer Basic Reporting: Provides security administrators with visible logs to identify which users are being targeted most heavily by malicious campaigns",
        "Quarantine Management: Isolates suspicious messages automatically, allowing IT administrators to inspect payloads safely and manage user release requests.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Teams Essentials is a professional, standalone collaboration and virtual meeting platform designed specifically for small businesses. It serves as a dedicated communication solution for organizations that already maintain an independent email hosting setup (such as Google Workspace) but require enterprise-grade video conferencing and group chat. By unbundling the core meeting engine from full Microsoft 365 productivity suites, it enables teams to connect with employees, customers, and partners via a single, cost-effective hub." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Extended Meeting Durations: Host continuous virtual video or audio group sessions lasting up to 30 hours per meeting",
        "Massive Meeting Capacity: Connect distributed teams or external clients with support for up to 300 concurrent participants per session",
        "Advanced Meeting Recordings: Capture live video calls alongside automated text transcripts and live English captions to reference later",
        "Flexible Interactive Formats: Boost audience engagement during sessions using built-in breakout rooms, interactive polling, and custom Together Mode backdrops",
        "Universal Calendar Sync: Integrate seamlessly with external scheduling systems, allowing direct, real-time synchronization with Google Calendar or on-premises Outlook setups",
        "Continuous Group Chat: Maintain team-wide alignment via permanent group chat rooms, threaded channel conversations, and drag-and-drop file distributions",
        "Built-In Data Protection: Secure all calls, direct messages, and cloud files automatically with native, enterprise-grade data encryption.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Teams Rooms Pro (Without Audio Conferencing) is an enterprise-grade cloud subscription designed specifically to power dedicated meeting room devices and hardware consoles. It transforms physical meeting spaces—ranging from small huddle areas to massive boardrooms—into highly interactive, secure, and collaborative hybrid spaces. This specialized operational tier delivers advanced multi-screen video routing, smart AI-driven front-row layouts, and comprehensive remote device management, while intentionally omitting PSTN dial-in telephony capabilities to lower licensing costs for organizations using pure VoIP architectures." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Intelligent Front Row Layouts: Maximizes eye-level contact by placing remote video participants along the bottom of the screen while keeping active chat threads and shared content visible simultaneously",
        "Dual-Screen Layout Support: Route video galleries and active shared presentations to separate physical displays concurrently to minimize visual clutter during large sessions",
        "AI-Powered Device Enhancements: Leverages hardware-native AI to drive active speaker tracking, smart framing, and acoustic echo cancellation across certified meeting room setups",
        "Proactive Device Management: Equips IT administrators with real-time hardware status metrics, automated software patch distributions, and remote configuration tools via the Teams Admin Center",
        "Advanced Meeting Room Analytics: Tracks hardware utilization rates, call quality metrics, and spatial acoustics to help optimize future campus infrastructure investments",
        "One-Touch Join Interface: Simplifies user interactions by surfacing active calendar invites onto the room’s touch console for instantaneous, one-tap meeting launches",
        "Secure Wireless Sharing: Allows local participants to broadcast screens safely from personal laptops or mobile devices via Teams casting or proximity joins without physical cable plugins.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Visio Plan 2 is the premium, cloud-powered diagramming and vector graphics platform engineered for business analysts, IT professionals, and enterprise engineers. This subscription unlocks both the always-updated, full-featured Visio desktop application and the highly accessible Visio for the web interface. Built to transform complex data into clear visual structures, it enables organizations to map out intricate business processes, document network architectures, map databases, and visualize floor plans while collaborating in real time directly within the Microsoft 365 cloud environment. [1, 2, 3, 4, 5]" },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Premium Desktop App Access: Install the high-performance Visio client locally to access advanced design layouts, custom rendering tools, and offline editing. [1, 2, 3] Massive Stencil Library: Choose from over 25,000 specialized shapes and templates, including industry standards like BPMN 2.0, UML 2.5, and IEEE network schematics. [1, 2, 3, 4] Live Data-Linked Diagramming: Connect shapes directly to real-time data sources (such as Microsoft Excel, SQL Server, or SharePoint) to trigger automated structural and color updates. [1, 2, 3, 4, 5] Power BI Dashboard Integration: Embed operational Visio diagrams directly inside Power BI reports to create interactive, data-driven operational control panels. [1, 2] Automated Process Mapping: Generate professional flowcharts automatically from raw Excel data tables using the built-in Data Visualizer engine. [1, 2, 3] Real-Time Web Collaboration: Review, edit, and co-author complex system architectures simultaneously with team members via any modern web browser. [1, 2, 3, 4, 5] AutoCAD Drawing Support: Ingest advanced CAD files (up to DWG 2013) to overlay shapes, map facilities, and visualize complex spatial infrastructures seamlessly. [1, 2, 3]",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Multi-Device Deployment", "A single named user seat allows an employee to install and activate the Visio desktop app concurrently on up to five PCs, alongside web browser access."],
        ["Central M365 Admin Center", "IT administrators can instantly provision, assign, or reallocate active licenses dynamically as corporate personnel needs shift."],
        ["Flexible Corporate Purchasing", "Licenses are available via Microsoft Cloud Solution Provider (CSP) commitments or corporate-wide multi-year Enterprise Agreements (EA)."],
        ["No Maximum Seat Caps", "Designed without any user deployment limitations, enabling mid-sized and global enterprise organizations to deploy unlimited seats across their tenant."],
      ] },
    ],
  },
  "navisworks-simulate": {
    overview:     [
      { type: "p", text: "Autodesk Navisworks Simulate empowers architecture, engineering, and construction professionals to aggregate 3D data from multiple design applications into a single, lightweight project environment. Built for preconstruction scheduling and review, it helps teams analyze, communicate, and visualize project outcomes before construction begins. By combining scheduling data with 3D models (4D) and material tracking (5D), Navisworks Simulate ensures clear communication among stakeholders, smoother on-site logistics, and accurate material takeoffs." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Unified Model Aggregation: Combine massive 3D models and design files from Revit, Civil 3D, AutoCAD, and non-Autodesk applications into a single, responsive file. 4D Schedule Simulation: Link 3D geometry directly to project schedules (such as Primavera or Microsoft Project) to visually simulate construction timelines 5D Cost Quantification: Perform high-speed material takeoffs and measure distances, areas, and counts from integrated 3D models or 2D sheets",
        "Photorealistic Rendering & Animation: Generate professional 3D walk-throughs, fly-bys, and photorealistic asset animations to effectively communicate project intent",
        "Comprehensive Review Tools: Utilize sectioning tools, redlining capabilities, and comment tracking to review design packages with clients and field teams.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Included Product / Service", "Description", "Availability"], rows: [
        ["Navisworks Simulate Core", "Desktop application for project aggregation, 4D/5D simulation, rendering, and quantification.", "Local Installation"],
        ["Navisworks Freedom Viewer", "Complimentary distribution utility used to share compiled project files (NWD) with external field stakeholders.", "Free Desktop App"],
        ["File Format Exporters", "Comprehensive plugins to export native CAD and BIM formats into lightweight Navisworks files (NWC).", "Integrated Plugins"],
        ["Quantification Workbook", "Integrated utility for managing item catalogs, automated counts, and visual takeoff outputs.", "Local Utility"],
        ["Autodesk Desktop App", "Central workstation hub for software updates, performance patches, and hotfixes.", "Background Utility"],
      ] },
    ],
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Standard Commercial License", "Full commercial rights. Grants unrestricted usage for general contractors, scheduling managers, estimators, and project owners."],
        ["Flexible Term Contracts", "Available as a single-user electronic software delivery (ELD) license issued on fixed 1-year or multi-year subscription terms."],
        ["Autodesk Flex (Pay-As-You-Go)", "Fully compatible with Autodesk's token system, allowing seasonal coordinators or external trade contractors to consume tokens only on active days of use."],
      ] },
    ],
  },
  "office-365-e1": {
    overview:     [
      { type: "p", text: "Microsoft Office 365 E1 (No Teams) is a foundational, cloud-only enterprise subscription engineered for organizations requiring core business communication, cloud storage, and essential security features without integrated collaboration messaging platforms. Built for desktop-bound workforces, field staff, and shifting operational crews, this package moves productivity entirely to web browsers and mobile devices. It allows IT departments to provision enterprise-grade email, secure intranet spaces, and essential data compliance baselines cost-effectively, completely decoupled from any video conferencing or chat applications." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Web-First Enterprise Productivity: Create, edit, and share documents seamlessly via online web browser layouts of Word, Excel, PowerPoint, and OneNote",
        "Business-Class Cloud Email: Connect distributed workforces with a high-capacity 50GB Outlook exchange mailbox per user featuring custom corporate domain routing",
        "Centralized Corporate Intranet: Build institutional knowledge centers, department resource hubs, and structured document libraries using SharePoint Online",
        "Personal Cloud Workspace: Equip each employee seat with 1TB of personal OneDrive cloud storage to safely sync, store, and access files from any machine",
        "Automated Form and Data Collection: Design internal surveys, operational feedback forms, and customer questionnaires using Microsoft Forms",
        "Essential Cloud Security: Protect email environments from spam, phishing, and known malware vectors using native Exchange Online Protection (EOP)",
        "Core Information Governance: Establish basic mailbox retention policies, execute tenant-wide keyword content searches, and maintain legal hold baselines.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Office LTSC Standard 2024 is a specialized, volume-licensed productivity suite engineered specifically for organizations requiring a fixed, unchanging feature set. As a Commercial Perpetual asset, it grants your enterprise permanent ownership of the software version with a one-time purchase, completely eliminating recurring subscription fees. Built for highly regulated industries, air-gapped secure labs, and manufacturing terminals, this Long-Term Servicing Channel (LTSC) release functions entirely offline. This setup allows organizations to run mission-critical applications without internet dependency or unexpected interface changes." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "\"Frozen in Time\" Servicing: Operates with a completely locked functional architecture, receiving critical security patches over a 5-year lifecycle without feature-creep",
        "Zero Internet Dependency: Functions entirely offline without checking into online cloud validation servers, perfect for disconnected intranets",
        "Dynamic Excel Capabilities: Leverage modern computational formula elements—including text manipulation arrays and dynamic image integration fields",
        "Granular Group Policy Controls: Enables IT administrators to centrally configure, restrict, and silence background software behaviors using standard server policies",
        "Unified Office Deployment Tool (ODT): Simplifies machine staging by allowing IT teams to execute silent, pre-configured network installations",
        "Advanced Outlook Scheduling: Streamlines corporate meeting scheduling with automated message caching, priority sorting, and simplified calendar alignments",
        "Hardware-Bound Stability: Reduces system crashes in multi-user terminal configurations by utilizing a predictable and highly optimized local hardware profile.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Oracle Primavera P6 Professional Project Management is the gold standard for heavy-discipline enterprise project management, critical path scheduling, and resource control. This specific commercial licensing variant grants an Application User Perpetual right of use, meaning your organization owns the software license indefinitely without mandatory recurring annual subscription fees. Engineered to handle large-scale, highly complex, and multi-faceted initiatives, it enables project schedulers, control managers, and engineers to orchestrate tens of thousands of activities, balance localized resource pools, and maintain complete structural integrity across global portfolio hierarchies." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Perpetual Asset Ownership: Acquire a permanent right to operate the specific software version version indefinitely, moving software costs from operational expenses (OpEx) to capital expenditures (CapEx)",
        "Massive Scale Scheduling: Build, manage, and calculate critical paths for massive projects containing up to 100,000 active individual activities simultaneously",
        "Intelligent Critical Path Method (CPM): Execute deep algorithmic forward and backward pass calculations to pinpoint zero-float tasks and accurately forecast project completion dates",
        "Advanced Resource Levelling: Analyze localized or enterprise-wide labor, equipment, and material allocations to resolve resource over-allocations based on project priority rankings",
        "Granular Baseline Comparison: Log an unlimited number of targeted baseline snapshots to precisely track structural variances in cost, schedule duration, and resource burn rates over time",
        "Risk & Threshold Tracking: Establish custom key performance indicators (KPIs) and automated threshold alerts to proactively isolate variance spikes before they impact budgets",
        "Enterprise ERP Connectivity: Bridge operational engineering schedules seamlessly with corporate financial backbones using optional enterprise data exchange gateways.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Oracle Primavera P6 Enterprise Project Portfolio Management (EPPM) is a 100% web-based, enterprise-grade project portfolio management solution designed to prioritize, plan, manage, and execute large-scale programs and portfolios. This specific commercial licensing variant grants an Application User Perpetual right of use, giving your organization permanent ownership of the software license without mandatory recurring seat subscription fees. Built on a robust Java architecture and powered by centralized enterprise databases, P6 EPPM enables executive leadership, Project Management Offices (PMOs), and globally distributed teams to collaborate simultaneously on complex, multi-tiered project hierarchies with real-time performance visibility." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Perpetual Asset Ownership: Secure an infinite legal right to operate the software platform version, transitioning software costs into a capital expenditure (CapEx) asset. 100% Web-Based Browser Interface: Access the complete portfolio infrastructure from anywhere through any modern web browser without local desktop client dependencies",
        "Global Portfolio & EPS Management: Organize cross-regional projects into structured Enterprise Project Structures (EPS) and user-defined portfolios for high-level executive tracking",
        "Interactive Executive Dashboards: Generate real-time visual scorecards and interactive web dashboards to monitor key performance indicators (KPIs) and project health",
        "Cross-Project Resource Optimization: Analyze, track, and dynamically level labor, equipment, and material resources across the entire organization's active project ecosystem",
        "P6 Team Member Web & Mobile Interface: Allow field workers to quickly submit timesheets, update task progress, and log issues using specialized mobile web layouts or native apps",
        "Integrated Business Intelligence (BI): Utilize native reporting via Oracle BI Publisher to distribute complex, automated enterprise compliance matrices and standard corporate project templates.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Oracle Software Update License & Support is the foundational enterprise maintenance program required to sustain, secure, and evolve Oracle on-premises perpetual software assets. Rather than a standalone software application, this service acts as a mandatory first-year attachment to perpetual licenses—such as Primavera P6, Oracle Database, and WebLogic—granting organizations continuous access to critical security patches, version upgrades, and live 24/7 technical troubleshooting. It ensures that an enterprise's structural backend architecture remains optimized and compliant with changing operating systems and corporate IT perimeters." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Universal Version Upgrades: Grants immediate deployment rights to any major new product releases, functionality shifts, and system documentation enhancements without repurchase costs",
        "Critical Patch Management: Provides instant access to Oracle's quarterly Critical Patch Updates (CPUs) and security alerts to continuously harden systems against vulnerabilities. 24/7 Technical Support Desk: Delivers unrestricted access to Oracle Support Specialists via phone or the online My Oracle Support (MOS) ticketing ecosystem for rapid incident response",
        "Tax, Legal, and Regulatory Updates: Automates localized compliance updates, keeping financial or reporting software tightly aligned with shifting regional regulations",
        "Pre-Built Upgrade Scripts: Supplies automated data migration and database optimization scripts to simplify version hops between legacy environments and modern frameworks",
        "Lifetime Support Policy Alignment: Integrates directly with Oracle’s multi-tiered lifecycle frameworks, moving seamlessly across Premier, Extended, and Sustaining support stages as software versions age",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Planner and Project Plan 3 is a unified, cloud-based project and portfolio management (PPM) solution engineered for project managers, team leads, and enterprise planners. It bridges the gap between everyday agile task tracking and complex, heavy-discipline scheduling by combining the lightweight coordination of Microsoft Planner with the robust power of Project for the web and the Project Online desktop client. Operating natively within the Microsoft 365 cloud, this subscription enables organizations to optimize localized resource allocations, balance competing project portfolios, and maintain absolute structural control over timeline dependencies." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Advanced Desktop & Web Scheduling: Author and refine intricate schedules using either the premium offline Project Online desktop client or highly responsive web browser workspaces",
        "Unified Project Views: Toggle instantly between multiple layout methodologies including highly visual Kanban boards, structured grid lists, and dynamic interactive Gantt charts",
        "Intelligent Dependency Management: Map out absolute task relationships and link critical path items together to prevent project timeline drift across shifting scopes Enterprise Resource Optimization: Analyze, track, and dynamically level labor, equipment, and material metrics across your entire organization's active project ecosystem",
        "Unified Planner Collaboration: Link high-level portfolio milestones seamlessly to operational, everyday team tasks managed inside Microsoft Planner",
        "Interactive Power BI Reporting: Build out customized, deep analytics dashboards and portfolio summary reports utilizing pre-configured data pipelines",
        "Native Microsoft Teams Integration: Embed active schedules, Kanban boards, and project chat feeds directly into collaborative Teams channels.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Planner Plan 1 is a cloud-native, intuitive task and lightweight project management platform designed for teams that need to organize, track, and collaborate on visual workflows. It bridges the gap between basic checklist applications and heavy, complex portfolio scheduling tools by offering an approachable, highly collaborative workspace. Operating natively within the Microsoft 365 cloud environment, this subscription equips team leads, agile squads, and operational departments with flexible tracking layouts to drive everyday project execution and maintain visibility over fast-moving team initiatives." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Visual Work Management: Create, update, and organize team tasks using highly interactive Kanban boards, structured grid lists, or timeline charts",
        "Custom Task Organization: Tailor your boards by categorizing tasks into custom sprint blocks or priority buckets using color-coded labels and tags",
        "Dynamic Timeline Views: Map out basic task relationships and track schedule durations visually using a clean, streamlined Gantt-style timeline view",
        "Collaborative Task Cards: Attach rich information directly to individual task elements, including checklist sub-items, file hyperlinks, due dates, and real-time chat comments",
        "My Tasks Dashboard: Consolidates every task assigned to a specific user across all active team plans into a single, personalized dashboard to streamline individual daily priorities",
        "Native Teams Integration: Embed active project boards and timeline trackers directly into collaborative Microsoft Teams channels for seamless side-by-side communication",
        "Automated Email Notifications: Keeps the team aligned by automatically triggering email and push alerts when tasks are assigned, altered, or approaching a due date deadline.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Power BI Pro is a cloud-based business intelligence platform that equips users with self-service analytics to discover insights, visualize data, and share interactive dashboards across an organization. Built for data analysts, business leads, and corporate decision-makers, it enables secure data modeling, real-time reporting, and collaborative decision-making. Operating natively within the Microsoft 365 cloud environment, this license provides individual users with the necessary infrastructure to publish and distribute dashboards securely, establishing a unified data culture while maintaining rigorous enterprise security standards." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Interactive Data Visualizations: Create dynamic reports utilizing hundreds of modern charts, graphs, map matrices, and custom community visuals",
        "Multi-Source Data Ingestion: Extract, clean, and model structured or unstructured data seamlessly from over 100 on-premises and cloud-native databases",
        "Secure Workspace Collaboration: Co-author, manage, and distribute interactive report dashboards with team members inside protected Power BI cloud workspaces",
        "Automated Data Refreshes: Keep corporate dashboards up to date by scheduling up to 8 automated data refreshes per day for connected datasets",
        "Native M365 Suite Integration: Embed active, interactive analytics dashboards directly into Microsoft Teams channels, SharePoint portals, or PowerPoint slide decks",
        "Mobile-Optimized Dashboards: Author custom, responsive report layouts designed specifically for secure viewing and data exploration on portable devices",
        "Row-Level Security (RLS): Enforce granular data access constraints so users only see specific rows or datasets mapped to their exact organizational permissions.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Power BI Premium Per User (PPU) is an advanced, enterprise-grade business intelligence license that grants individual users access to Premium capacity features without requiring a large-scale corporate tenant investment. Operating under Microsoft’s New Commerce Experience (NCE) framework, it is engineered for advanced data analysts, data scientists, and enterprise reporting leads. This tier delivers high-performance data modeling capabilities, larger dataset limits, advanced AI insights, and automated data pipelines to accelerate complex data transformation and enterprise-wide dashboard delivery." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Massive Model Sizes: Build and deploy complex data models with an expanded individual dataset limit of up to 100 GB of compressed RAM",
        "Frequent Data Refreshes: Keep corporate dashboards synchronized with real-time operational shifts by scheduling up to 48 automated data refreshes per day",
        "Advanced AI Analytics: Uncover hidden trends natively using advanced machine learning models, text analytics, image detection, and automated root-cause insights",
        "Pixel-Perfect Paginated Reports: Design, format, and print highly structured operational documents (such as invoices, delivery manifests, and financial sheets) using Power BI Report Builder",
        "Automated Dataflows & DataMart’s: Build self-service, no-code data warehouses and extract, transform, and load (ETL) ingestion pipelines directly within the cloud workspace",
        "Advanced Lifecycle Management: Accelerate code transitions from testing to deployment safely using visual deployment pipelines and target environment matching",
        "XMLA Endpoint Connectivity: Connect deep external modeling tools (such as Tabular Editor or DAX Studio) directly to the cloud dataset to streamline script optimization.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Named User Allocation", "Every license seat is tied securely to an individual's corporate account identity or work email rather than a specific physical machine."],
        ["Strict Sharing Validation", "Unlike dedicated tenant capacity, PPU operates on an isolated tier. To view or interact with a report hosted in a PPU workspace, both the author and the consumer must possess a PPU license."],
        ["NCE Commitment Strictness", "Purchased under the NCE framework, meaning annual commitments lock in pricing and headcount. Headcount reductions can only occur during the initial 72-hour purchase window."],
        ["No Maximum User Caps", "Designed without any user deployment limitations, enabling organizations to deploy unlimited seats across their corporate domain."],
      ] },
    ],
  },
  "product-design-manufacturing-collection": {
    overview:     [
      { type: "p", text: "The Autodesk Product Design & Manufacturing Collection (PDMC) is an enterprise-grade suite of professional CAD, CAM, and CAE applications. It provides engineering and manufacturing teams with a complete set of tools to design, simulate, and manufacture complex products. The IC Commercial designation indicates a fully compliant, professional Industry Collection license intended for profit-generating business operations. By unifying professional-grade 3D mechanical design with advanced simulation and CNC programming, this collection eliminates data silos and streamlines production from initial concept to the final factory floor layout." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Professional 3D Mechanical Design: Create complex parametric models, massive assemblies, and production-ready drawings",
        "Integrated Simulation (FEA): Test stress, thermal response, vibration, and fatigue using advanced Nastran technology",
        "Advanced CNC Machining (CAM): Generate high-efficiency 2.5-axis to 5-axis toolpaths directly inside your CAD workspace",
        "Factory Floor Optimization: Plan, analyze, and optimize complete manufacturing facilities with visual layout tools",
        "Automated Nesting: Optimize material yield for sheet metal cutting to minimize scrap and material costs",
        "Associative Workflows: Downstream CAM toolpaths and simulation models update automatically when the base CAD design changes.",
      ] },
    ],
    whatsIncluded:     [
      { type: "table", headers: ["Name", "Description", "Detail"], rows: [
        ["Autodesk Inventor Professional", "3D Mechanical Design", "Delivers high-end parametric modeling, assembly design, and production drawings."],
        ["AutoCAD (with Toolsets)", "2D & 3D Drafting", "Accelerates drafting with specialized Mechanical, Electrical, and Plant 3D toolsets."],
      ] },
    ],
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Microsoft Project Professional 2024 is the premium desktop project management software built for project managers, scheduling engineers, and enterprise resource coordinators. As a Commercial Perpetual asset, it grants your enterprise permanent ownership of the software application version with a one-time purchase, completely eliminating recurring monthly cloud subscription fees. Operating natively on local system hardware, it provides a highly stable, offline platform to author intricate critical path schedules, balance competing resource pools, and maintain absolute structural control over timelines and budgets without requiring a permanent internet connection." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "One-Time Perpetual Asset: Pay once for permanent ownership of the desktop software edition, moving project management tooling from operational expenses (OpEx) to capital assets (CapEx)",
        "Advanced Scheduling Engine: Automate task scheduling, map complex task dependencies, and calculate forward/backward passes to instantly identify the critical path",
        "Comprehensive Resource Management: Define distinct labor, equipment, and material pools to track costs, assign capacities, and dynamically level resources to prevent over-allocation",
        "Granular Baseline Comparisons: Set and lock multiple baseline snapshots to measure real-time project variance against original timeline and budget estimations",
        "Flexible Visual Layouts: Toggle project data instantly between high-fidelity Gantt charts, customized Kanban task boards, structured sheet grids, and timeline summary views",
        "Built-In Reporting Templates: Generate professional project status dashboards, burndown charts, and cost overview summaries locally without external business intelligence add-ons",
        "Project Server Interoperability: Connect the desktop client seamlessly to an on-premises Microsoft Project Server deployment to facilitate centralized, team-wide timesheet and schedule tracking.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
      { type: "table", headers: ["Licensing Option", "Description"], rows: [
        ["Pay-Once Perpetual Asset", "This license functions on a non-subscription legal framework, meaning the software license will never expire or auto-terminate."],
        ["Per-Device Licensing Matrix", "Every license code is bound permanently to one unique physical computer rather than a floating user account or cloud identity."],
        ["Multi-User Sequential Access", "Multiple team members can use the software running on the licensed workstation sequentially, but only one active user can operate it at any single time."],
        ["Microsoft CSP Volume Channel", "Distributed strictly through the Microsoft Commercial licensing framework, consolidating software tracking and key provisioning inside your company's central admin domain."],
        ["Total Cloud Independence", "The core client application executes entirely locally and does not require an active internet connection to build, edit, or save mission-critical project files."],
      ] },
    ],
  },
  "windows-11-pro": {
    overview:     [
      { type: "p", text: "Windows 11 Pro Commercial Perpetual (specifically SKU variant 0004 under the Microsoft Cloud Solution Provider program) is an enterprise-grade commercial upgrade license. It permanently transforms a baseline consumer operating system into a secure business workstation. Engineered for small to medium businesses and managed corporate fleets, this software asset provides lifetime ownership with no recurring subscription fees. It grants IT administrators the essential management tools, data protection protocols, and native identity frameworks needed to orchestrate hybrid workforces safely." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Advanced BitLocker Encryption: Insulates confidential corporate data assets from unauthorized physical access or data theft by encrypting the complete local hard drive volume. [1, 2, 3, 4, 5] Microsoft Entra ID / Domain Join: Links corporate laptops natively to cloud identity directories, allowing single sign-on (SSO) configuration and unified network policy compliance. [1, 2, 3, 4] Windows Information Protection (WIP): Restricts data leakage paths by systematically boxing off and separating corporate data from personal user applications. [1, 2, 3, 4] Remote Desktop Host Control: Enables employees to securely access files, folders, and applications hosted on their primary office workstation from external locations",
        "Windows Sandbox Environment: Executes suspicious or untrusted software configurations inside a lightweight, isolated desktop space that discards all code cleanly upon closing",
        "Granular Group Policy Management: Empowers IT infrastructure specialists to customize user interface permissions, restrict peripheral devices, and enforce network-wide update pacing",
        "Hyper-V Virtualization: Hosts completely distinct operating system installations simultaneously on a single computer using local hardware hypervisor acceleration.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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
    overview:     [
      { type: "p", text: "Windows Server 2025 Standard is a cloud-ready, hybrid-optimized server operating system engineered to power on-premises data centers, application hosting, and localized infrastructure workloads. This specific commercial variant delivers a Perpetual 16 Core Base License Pack, establishing a lifetime asset right with zero recurring monthly subscription or seat costs. Designed for physical environments or minimally virtualized deployments, it introduces cutting-edge capabilities like native hotpatching, advanced multi-layered SMB over QUIC security, and seamless hybrid management loops tied directly into the Microsoft Azure framework." },
    ],
    keyFeatures:     [
      { type: "ul", items: [
        "Base Core-Compliance Baseline: Serves as the official foundational license pack required to satisfy Microsoft’s mandatory 16-core minimum per physical server baseline rule",
        "Dual Virtual OSE/VM Rights: Grants deployment authorization for up to two virtual machines (VMs) or Hyper-V containers when all physical cores on the target host are fully licensed",
        "Azure Arc-Enabled Hybrid Scale: Integrates directly with Azure Arc out of the box, allowing IT teams to orchestrate local servers, monitor performance metrics, and provision cloud features from a single portal",
        "Next-Gen Storage Performance: Maximizes structural input/output operations using modernized storage engine layers, including significant NVMe storage optimizations and storage bus enhancements",
        "Hardened Active Directory (AD): Insulates corporate directory networks from credential exploitation with advanced cryptographic security upgrades and scalable 32k database page sizes",
        "Advanced Multi-Core Hardware Scale: Supports massive local hardware deployments, scaling to handle configurations containing up to 2,048 logical processors and 4 PB of physical RAM",
        "Integrated Windows Defender: Deploys native, multi-layered system protection mechanisms to insulate the underlying server boot sectors from real-time rootkits, malware, and ransom scripts.",
      ] },
    ],
    whatsIncluded:     [
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
    subscriptionLicensing:     [
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

export const WORD_CATALOG_DETAIL_SLUGS = new Set<string>(Object.keys(WORD_CATALOG_DETAIL_CONTENT));

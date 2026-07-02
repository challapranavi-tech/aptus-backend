import { SITE } from "@/lib/constants";
import type { MarketingPageContent } from "@/types/marketing-page";

const MAILTO = `mailto:${SITE.email}`;

export type NavProductCategory =
  | "elv"
  | "multimedia"
  | "quantityTakeoff"
  | "structural"
  | "cyberSecurity"
  | "educational"
  | "edms";

export type NavProductPageDef = {
  path: string;
  label: string;
  category: NavProductCategory;
  description: string;
  intro: string;
  features: { title: string; body: string }[];
};

const ELV_WHY_APTUS = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Experienced Integrators",
      body: "25+ years delivering ELV and security projects for healthcare, energy, education, and public sector clients across Oman.",
    },
    {
      title: "End-to-End Delivery",
      body: "Single partner from site survey and design through installation, commissioning, and after-sales support.",
    },
    {
      title: "Quality Products",
      body: "We work with leading global brands to ensure reliable, standards-compliant ELV systems.",
    },
    {
      title: "Local Presence",
      body: "Muscat-based team providing fast response, on-site support, and long-term partnership in Oman.",
    },
  ],
};

const SOFTWARE_WHY_APTUS = {
  id: "why-aptus",
  visible: true,
  eyebrow: "Why Aptus",
  title: { before: "Why Choose", accent: "Aptus Infotech" },
  align: "center" as const,
  items: [
    {
      title: "Authorized Partner",
      body: "Genuine software licenses with official support channels and compliant procurement.",
    },
    {
      title: "Implementation Support",
      body: "Guidance on deployment, licensing models, and integration with your existing workflows.",
    },
    {
      title: "Local Expertise in Oman",
      body: "Muscat-based team providing responsive sales, technical support, and training across the GCC.",
    },
    {
      title: "End-to-End Service",
      body: "From license procurement and renewal to rollout planning — a single trusted partner.",
    },
  ],
};

/** Leaf pages linked from site nav without dedicated TS content modules. */
export const NAV_PRODUCT_PAGE_DEFS: NavProductPageDef[] = [
  // ELV sub-pages
  {
    path: "/access-control-system",
    label: "Access Control System",
    category: "elv",
    description:
      "Card, biometric, and mobile access control systems for secure entry management in Oman.",
    intro:
      "Aptus Infotech designs and deploys access control solutions that protect people, assets, and restricted areas. From single-door controllers to enterprise-wide systems, we integrate readers, credentials, and management software with your building infrastructure.",
    features: [
      { title: "Multi-Technology Readers", body: "Support for card, PIN, biometric, and mobile credentials." },
      { title: "Centralized Management", body: "Monitor doors, users, and events from a unified control platform." },
      { title: "Integration Ready", body: "Connect with CCTV, visitor management, and HR systems." },
      { title: "Compliance & Audit", body: "Detailed access logs and reporting for security and regulatory needs." },
    ],
  },
  {
    path: "/thermal-scanners",
    label: "Thermal Scanners",
    category: "elv",
    description:
      "Thermal screening systems for health monitoring and access control at high-traffic facilities.",
    intro:
      "Deploy thermal scanning solutions for lobbies, healthcare facilities, and industrial sites. Aptus Infotech supplies, installs, and integrates thermal cameras with access control and alerting workflows.",
    features: [
      { title: "Non-Contact Screening", body: "Rapid temperature detection at entry points without bottlenecks." },
      { title: "Alert Integration", body: "Trigger notifications and access denial based on configured thresholds." },
      { title: "Multi-Site Monitoring", body: "Centralized dashboards for facilities with multiple entrances." },
      { title: "Professional Installation", body: "Calibrated deployment and commissioning by certified technicians." },
    ],
  },
  {
    path: "/advanced-control-room-solutions",
    label: "Advanced Control Room Solutions",
    category: "elv",
    description:
      "Integrated control room design for monitoring, command, and operational visibility.",
    intro:
      "Build mission-critical control rooms with video walls, operator consoles, KVM switching, and unified monitoring of ELV and IT systems. Aptus Infotech delivers design, integration, and commissioning for 24/7 operations centers.",
    features: [
      { title: "Video Wall Systems", body: "High-resolution display arrays for multi-source situational awareness." },
      { title: "Operator Workstations", body: "Ergonomic consoles with integrated AV and control interfaces." },
      { title: "Unified Monitoring", body: "Aggregate CCTV, access, BMS, and network alerts on one platform." },
      { title: "Redundancy & Reliability", body: "Architecture designed for continuous operation and failover." },
    ],
  },
  {
    path: "/cctv-camera",
    label: "CCTV Camera",
    category: "elv",
    description:
      "IP and analog CCTV surveillance systems with recording, analytics, and remote monitoring.",
    intro:
      "Protect your facility with professionally designed CCTV systems from Aptus Infotech. We supply cameras, NVR/VMS platforms, storage, and network infrastructure tailored to indoor, outdoor, and perimeter security requirements.",
    features: [
      { title: "IP & Analog Options", body: "Mix of camera technologies to match site conditions and budgets." },
      { title: "Smart Analytics", body: "Motion detection, line crossing, and AI-based event alerts." },
      { title: "Remote Access", body: "Secure viewing from desktop and mobile for authorized users." },
      { title: "Scalable Storage", body: "Retention policies and storage sizing aligned to compliance needs." },
    ],
  },
  {
    path: "/gate-automation",
    label: "Gate Automation",
    category: "elv",
    description:
      "Automated gate and barrier systems for residential, commercial, and industrial access.",
    intro:
      "Automate vehicle and pedestrian gates with reliable motors, safety sensors, and access control integration. Aptus Infotech handles design, installation, and maintenance for sliding, swing, and barrier gate systems.",
    features: [
      { title: "Safety Compliance", body: "Photo beams, loops, and safety edges to protect users and vehicles." },
      { title: "Access Integration", body: "Link gates with RFID, intercom, and visitor management systems." },
      { title: "Heavy-Duty Options", body: "Industrial-grade automation for high-cycle commercial sites." },
      { title: "Maintenance Programs", body: "Preventive service to minimize downtime and extend equipment life." },
    ],
  },
  {
    path: "/home-automation",
    label: "Home Automation",
    category: "elv",
    description:
      "Smart home automation for lighting, climate, security, and entertainment control.",
    intro:
      "Create connected living spaces with intelligent lighting, HVAC, shading, AV, and security control from a single interface. Aptus Infotech designs and installs home automation systems for villas and premium residences in Oman.",
    features: [
      { title: "Unified Control", body: "Manage lighting, climate, and AV from wall panels and mobile apps." },
      { title: "Energy Efficiency", body: "Automated schedules and sensors to reduce energy consumption." },
      { title: "Security Integration", body: "Combine CCTV, access, and alarm systems in one ecosystem." },
      { title: "Custom Scenes", body: "One-touch presets for welcome, away, entertainment, and sleep modes." },
    ],
  },
  {
    path: "/audio-video-solutions",
    label: "Audio Video Solutions",
    category: "elv",
    description:
      "Professional AV systems for boardrooms, auditoriums, hospitality, and public spaces.",
    intro:
      "From conference rooms to large venues, Aptus Infotech delivers audio, video, conferencing, and presentation systems. We integrate displays, DSP, microphones, speakers, and control platforms for seamless collaboration.",
    features: [
      { title: "Conference Systems", body: "Zoom/Teams-ready rooms with cameras, mics, and display sharing." },
      { title: "Public Address", body: "Paging and background music for retail, hospitality, and campuses." },
      { title: "Digital Signage", body: "Content distribution to displays across multiple zones." },
      { title: "Centralized Control", body: "Touch panels and automation for non-technical users." },
    ],
  },
  {
    path: "/network-and-structured-cabling-solutions",
    label: "Network and Structured Cabling",
    category: "elv",
    description:
      "Structured copper and fiber cabling for reliable data, voice, and network connectivity.",
    intro:
      "Build the foundation for IT and ELV systems with standards-compliant structured cabling. Aptus Infotech designs and installs Cat6/Cat6A copper and fiber infrastructure with testing, labeling, and documentation.",
    features: [
      { title: "Copper & Fiber", body: "Horizontal and backbone cabling for offices, campuses, and industrial sites." },
      { title: "Certified Testing", body: "Fluke testing and as-built documentation for warranty compliance." },
      { title: "Rack & Patch Management", body: "Organized MDF/IDF rooms with cable management and labeling." },
      { title: "Future-Ready Design", body: "Capacity planning for Wi-Fi, CCTV, and IoT expansion." },
    ],
  },
  {
    path: "/ups",
    label: "UPS",
    category: "elv",
    description:
      "Uninterruptible power supply systems for critical IT, ELV, and control equipment.",
    intro:
      "Protect servers, network gear, and control systems from power disturbances with correctly sized UPS solutions. Aptus Infotech supplies, installs, and maintains online and line-interactive UPS systems with battery management.",
    features: [
      { title: "Sizing & Design", body: "Load analysis and runtime requirements for each critical circuit." },
      { title: "Online & Line-Interactive", body: "Options from desktop to three-phase data center UPS." },
      { title: "Battery Maintenance", body: "Replacement schedules and health monitoring to avoid failures." },
      { title: "Integration", body: "SNMP monitoring and graceful shutdown with servers and network gear." },
    ],
  },
  {
    path: "/guest-room-management",
    label: "Guest Room Management",
    category: "elv",
    description:
      "Guest room management systems for hotels — energy control, comfort, and staff efficiency.",
    intro:
      "Optimize hotel operations with GRMS that integrates door locks, HVAC, lighting, and occupancy sensors. Aptus Infotech implements guest room management platforms that improve guest comfort while reducing energy costs.",
    features: [
      { title: "Occupancy-Based Control", body: "Adjust HVAC and lighting automatically based on guest presence." },
      { title: "Staff Dashboards", body: "Housekeeping and maintenance alerts from in-room status panels." },
      { title: "PMS Integration", body: "Connect with property management systems for check-in/out automation." },
      { title: "Energy Savings", body: "Typical 15–30% reduction in room energy consumption." },
    ],
  },
  {
    path: "/nurse-calling-system",
    label: "Nurse Calling System",
    category: "elv",
    description:
      "Nurse call and emergency communication systems for hospitals and healthcare facilities.",
    intro:
      "Ensure patient safety with reliable nurse call systems featuring bedside units, corridor indicators, and staff mobile alerts. Aptus Infotech designs healthcare communication systems aligned with facility workflows and regulations.",
    features: [
      { title: "Bedside & Bathroom Calls", body: "Pull cords, push buttons, and voice communication at point of care." },
      { title: "Staff Notification", body: "Corridor lamps, central panels, and wireless staff devices." },
      { title: "Event Logging", body: "Response time tracking and audit trails for quality improvement." },
      { title: "Scalable Architecture", body: "From clinic wards to multi-tower hospital campuses." },
    ],
  },
  {
    path: "/smatv-iptv",
    label: "SMATV / IPTV",
    category: "elv",
    description:
      "Satellite master antenna TV and IPTV distribution for hospitality and multi-dwelling buildings.",
    intro:
      "Deliver satellite, cable, and IPTV channels to guest rooms, apartments, and common areas. Aptus Infotech designs headend systems, distribution networks, and set-top integration for hotels and residential towers.",
    features: [
      { title: "Multi-Channel Distribution", body: "Aggregate satellite and terrestrial sources to all endpoints." },
      { title: "IPTV Middleware", body: "Interactive menus, VOD, and property branding on smart TVs." },
      { title: "HD & 4K Ready", body: "Infrastructure sized for current and future resolution requirements." },
      { title: "Centralized Management", body: "Channel lineup and firmware updates from a single headend." },
    ],
  },
  {
    path: "/rsi-queue-management",
    label: "Queue Management",
    category: "elv",
    description:
      "Queue management and customer flow systems for banks, clinics, and service centers.",
    intro:
      "Reduce wait times and improve customer experience with digital queue management — ticket dispensers, display screens, audio announcements, and counter calling systems. Aptus Infotech implements turnkey QMS for high-traffic service environments.",
    features: [
      { title: "Digital Ticketing", body: "Self-service kiosks and mobile queue joining options." },
      { title: "Display & Audio", body: "Counter calling on screens and speakers across waiting areas." },
      { title: "Analytics", body: "Wait time reports and service level dashboards for managers." },
      { title: "Multi-Branch Support", body: "Centralized monitoring across branch networks." },
    ],
  },
  {
    path: "/data-center-solutions",
    label: "Data Center Solutions",
    category: "elv",
    description:
      "Data center infrastructure — racks, cooling, power, monitoring, and structured cabling.",
    intro:
      "Build or upgrade data center facilities with Aptus Infotech. We deliver rack layouts, hot/cold aisle design, PDU/UPS power, environmental monitoring, and fire suppression integration for enterprise and colocation environments.",
    features: [
      { title: "Rack & Power Design", body: "Capacity planning for compute, storage, and network loads." },
      { title: "Environmental Monitoring", body: "Temperature, humidity, leak, and smoke detection with alerting." },
      { title: "Structured Cabling", body: "High-density fiber and copper for server and top-of-rack switching." },
      { title: "Physical Security", body: "Access control, CCTV, and mantrap integration for secure facilities." },
    ],
  },
  {
    path: "/switching-and-routing",
    label: "Switching and Routing",
    category: "elv",
    description:
      "Enterprise network switching and routing for campus, data center, and WAN connectivity.",
    intro:
      "Deploy reliable network switching and routing infrastructure with Aptus Infotech. We supply, configure, and support core, distribution, and access layer switches plus routers for multi-site connectivity.",
    features: [
      { title: "Campus & DC Switching", body: "Layer 2/3 switches with PoE, stacking, and redundancy options." },
      { title: "Routing & SD-WAN", body: "Inter-site connectivity with QoS and security policies." },
      { title: "Network Design", body: "Topology planning, VLAN segmentation, and capacity sizing." },
      { title: "Managed Support", body: "Configuration backup, firmware updates, and fault response." },
    ],
  },
  {
    path: "/conference-room-solution",
    label: "Conference Room Solution",
    category: "elv",
    description:
      "Turnkey conference room AV and collaboration systems for hybrid meetings.",
    intro:
      "Equip meeting rooms with displays, video conferencing, wireless presentation, and room scheduling. Aptus Infotech delivers standardized room kits from huddle spaces to executive boardrooms with unified control.",
    features: [
      { title: "Video Conferencing", body: "Certified systems for Microsoft Teams, Zoom, and Google Meet." },
      { title: "Wireless Presentation", body: "One-click sharing from laptops and mobile devices." },
      { title: "Room Scheduling", body: "Panel displays integrated with calendar platforms." },
      { title: "Acoustic Treatment", body: "Microphone and speaker tuning for clear remote participation." },
    ],
  },
  // Multimedia products
  {
    path: "/bluebeam",
    label: "Bluebeam",
    category: "multimedia",
    description:
      "Bluebeam Revu — PDF-based markup, takeoff, and collaboration for construction and design teams.",
    intro:
      "Aptus Infotech supplies Bluebeam Revu licenses with deployment guidance for AEC teams. Streamline document review, quantity takeoff, and field collaboration with industry-standard PDF workflows.",
    features: [
      { title: "PDF Markup", body: "Rich annotation tools for design review and RFIs." },
      { title: "Quantity Takeoff", body: "Measure areas, lengths, and counts directly on drawings." },
      { title: "Studio Sessions", body: "Real-time collaboration on shared document sets." },
      { title: "Field Tools", body: "Mobile workflows for punch lists and site documentation." },
    ],
  },
  {
    path: "/chaos-corona",
    label: "Chaos Corona",
    category: "multimedia",
    description:
      "Chaos Corona photorealistic rendering for architecture, interior design, and visualization.",
    intro:
      "License Chaos Corona through Aptus Infotech for fast, artist-friendly rendering inside 3ds Max, Cinema 4D, and other DCC tools. Ideal for architectural visualization studios in Oman.",
    features: [
      { title: "Photoreal Quality", body: "Physically based rendering with minimal setup time." },
      { title: "Interactive Rendering", body: "Live preview while adjusting materials and lighting." },
      { title: "Asset Libraries", body: "Ready-made materials, skies, and vegetation for arch-viz." },
      { title: "Local Support", body: "License management and technical guidance from Aptus Infotech." },
    ],
  },
  {
    path: "/enscape",
    label: "Enscape",
    category: "multimedia",
    description:
      "Enscape real-time rendering and VR walkthroughs for Revit, SketchUp, Rhino, and Archicad.",
    intro:
      "Bring designs to life instantly with Enscape real-time visualization. Aptus Infotech provides Enscape licensing and support for architects and designers who need fast client presentations and VR experiences.",
    features: [
      { title: "Real-Time Rendering", body: "Instant visual feedback linked to your BIM or CAD model." },
      { title: "VR Walkthroughs", body: "Immersive client reviews with one-click VR export." },
      { title: "BIM Integration", body: "Works inside Revit, SketchUp, Rhino, Vectorworks, and Archicad." },
      { title: "Asset Library", body: "Entourage, vegetation, and lighting presets for quick scenes." },
    ],
  },
  {
    path: "/luminon",
    label: "Lumion",
    category: "multimedia",
    description:
      "Lumion architectural visualization — fast rendering, animations, and landscape design.",
    intro:
      "Create compelling architectural renders and flythrough animations with Lumion. Aptus Infotech supplies Lumion licenses with advice on hardware requirements and workflow integration.",
    features: [
      { title: "Fast Rendering", body: "Produce high-quality stills and animations in minutes." },
      { title: "LiveSync", body: "Real-time connection with Revit, SketchUp, and other modeling tools." },
      { title: "Landscape Tools", body: "Terrain, water, and vegetation for exterior visualizations." },
      { title: "Presentation Ready", body: "Export images and MP4 walkthroughs for client meetings." },
    ],
  },
  {
    path: "/nitro",
    label: "Nitro PDF",
    category: "multimedia",
    description:
      "Nitro PDF Pro — create, edit, convert, and sign PDF documents for business teams.",
    intro:
      "Deploy Nitro PDF across your organization with volume licensing from Aptus Infotech. A cost-effective alternative for PDF creation, editing, OCR, and e-signature workflows.",
    features: [
      { title: "PDF Editing", body: "Modify text, images, and pages in existing PDF files." },
      { title: "Conversion", body: "Convert Word, Excel, and PowerPoint to and from PDF." },
      { title: "E-Signatures", body: "Request and track digital signatures on contracts and forms." },
      { title: "Volume Licensing", body: "Centralized deployment and license management for IT teams." },
    ],
  },
  {
    path: "/sketchup",
    label: "SketchUp",
    category: "multimedia",
    description:
      "SketchUp 3D modeling for architecture, interior design, and construction visualization.",
    intro:
      "Aptus Infotech provides SketchUp Pro and Studio licenses with support for architects, designers, and contractors. Model quickly, generate presentations, and connect to rendering and BIM workflows.",
    features: [
      { title: "Intuitive Modeling", body: "Fast 3D concept design with push/pull and component libraries." },
      { title: "Layout", body: "Create 2D documentation and presentations from 3D models." },
      { title: "Extension Ecosystem", body: "Thousands of plugins for rendering, BIM, and analysis." },
      { title: "Studio Tools", body: "Scan Essentials, V-Ray, and Trimble Connect in Studio bundles." },
    ],
  },
  {
    path: "/twinmotion",
    label: "Twinmotion",
    category: "multimedia",
    description:
      "Twinmotion real-time arch-viz powered by Unreal Engine for stunning presentations.",
    intro:
      "License Twinmotion through Aptus Infotech for real-time architectural visualization. Import from Revit, SketchUp, Archicad, and Rhino to produce images, panoramas, and videos rapidly.",
    features: [
      { title: "Real-Time Quality", body: "Unreal Engine-powered visuals with drag-and-drop simplicity." },
      { title: "One-Click Export", body: "Panoramas, videos, and VR presentations for clients." },
      { title: "Live Links", body: "Synchronize with popular BIM and CAD authoring tools." },
      { title: "Phasing & Animation", body: "Construction sequencing and animated entourage." },
    ],
  },
  {
    path: "/v-ray",
    label: "V-Ray",
    category: "multimedia",
    description:
      "V-Ray photorealistic rendering for 3ds Max, SketchUp, Rhino, Revit, and more.",
    intro:
      "Aptus Infotech supplies Chaos V-Ray licenses for studios requiring production-grade rendering. GPU and CPU options with denoising for faster turnaround on architectural and product visualization.",
    features: [
      { title: "Production Rendering", body: "Industry-standard ray tracing for film-quality stills and animation." },
      { title: "GPU Acceleration", body: "Leverage modern GPUs for faster iteration cycles." },
      { title: "Wide Host Support", body: "Plugins for 3ds Max, SketchUp, Rhino, Revit, Cinema 4D, and more." },
      { title: "Chaos Ecosystem", body: "Works alongside Corona, Vantage, and Chaos Cloud." },
    ],
  },
  // Quantity takeoff
  {
    path: "/cubicost-bm-qs",
    label: "Cubicost BM/QS",
    category: "quantityTakeoff",
    description:
      "Cubicost BIM-based quantity surveying and cost estimation for construction projects.",
    intro:
      "Adopt Cubicost for BIM-integrated BOQ generation, cost estimation, and change management. Aptus Infotech provides licensing and implementation support for quantity surveyors and contractors in Oman.",
    features: [
      { title: "BIM Integration", body: "Extract quantities directly from Revit and other BIM models." },
      { title: "BOQ Generation", body: "Automated bill of quantities aligned to measurement standards." },
      { title: "Cost Control", body: "Track variations and update estimates as designs evolve." },
      { title: "Reporting", body: "Exportable reports for tendering and project controls." },
    ],
  },
  {
    path: "/plainswift",
    label: "PlanSwift",
    category: "quantityTakeoff",
    description:
      "PlanSwift digital takeoff and estimating software for construction professionals.",
    intro:
      "Speed up quantity takeoff from PDF and CAD drawings with PlanSwift. Aptus Infotech supplies licenses and training for estimators who need accurate, repeatable measurement workflows.",
    features: [
      { title: "Digital Takeoff", body: "Measure areas, lengths, and counts on screen from digital plans." },
      { title: "Custom Assemblies", body: "Build reusable formulas for recurring construction items." },
      { title: "Excel Integration", body: "Export takeoff data to spreadsheets and estimating tools." },
      { title: "Multi-User", body: "Collaborate on projects with shared templates and libraries." },
    ],
  },
  {
    path: "/rib-costx",
    label: "RIB CostX",
    category: "quantityTakeoff",
    description:
      "RIB CostX 2D and 3D/BIM takeoff and estimating for quantity surveyors.",
    intro:
      "RIB CostX combines 2D PDF takeoff with 3D/BIM model integration for comprehensive estimating. License through Aptus Infotech with support for deployment across QS teams.",
    features: [
      { title: "2D & 3D Takeoff", body: "Measure from PDFs and BIM models in one platform." },
      { title: "Workbooks", body: "Organize estimates by trade, zone, or custom breakdowns." },
      { title: "Revision Tracking", body: "Compare drawing revisions and highlight quantity changes." },
      { title: "Enterprise Ready", body: "Multi-user databases and audit trails for large projects." },
    ],
  },
  // Structural software
  {
    path: "/computers-structures",
    label: "Computers & Structures, Inc.",
    category: "structural",
    description:
      "CSI structural analysis and design software including ETABS, SAP2000, and SAFE.",
    intro:
      "Aptus Infotech supplies CSI software for structural engineers — ETABS for buildings, SAP2000 for general structures, and SAFE for slab and foundation design. Genuine licenses with local technical support.",
    features: [
      { title: "ETABS", body: "Building analysis and design for multi-story structures." },
      { title: "SAP2000", body: "General-purpose FEA for bridges, tanks, and special structures." },
      { title: "SAFE", body: "Slab, mat foundation, and transfer slab design and detailing." },
      { title: "Code Compliance", body: "Design modules for international and regional building codes." },
    ],
  },
  {
    path: "/prokon",
    label: "PROKON",
    category: "structural",
    description:
      "PROKON structural analysis and design suite for concrete and steel structures.",
    intro:
      "PROKON delivers modular tools for structural engineers — from frame analysis to member design and detailing. Aptus Infotech provides PROKON licensing and support for consulting firms in Oman.",
    features: [
      { title: "Modular Suite", body: "Purchase only the modules you need — analysis, design, detailing." },
      { title: "Concrete & Steel", body: "Design beams, columns, slabs, and connections to code." },
      { title: "Sumo Structural Modeller", body: "Integrated 3D modeling and analysis environment." },
      { title: "Local Support", body: "Implementation guidance and license management from Aptus Infotech." },
    ],
  },
  // Cyber security
  {
    path: "/fortinet",
    label: "Fortinet",
    category: "cyberSecurity",
    description:
      "Fortinet FortiGate next-generation firewalls and Security Fabric for enterprise protection.",
    intro:
      "Secure your network perimeter and branch offices with Fortinet FortiGate NGFWs. Aptus Infotech supplies hardware, licenses, configuration, and managed support for organizations in Oman.",
    features: [
      { title: "NGFW Protection", body: "Application-aware firewall, IPS, and anti-malware in one appliance." },
      { title: "SD-WAN", body: "Secure connectivity across branch offices and cloud workloads." },
      { title: "Security Fabric", body: "Unified management across FortiGate, FortiSwitch, and FortiAP." },
      { title: "Threat Intelligence", body: "FortiGuard updates for emerging threats and vulnerabilities." },
    ],
  },
  {
    path: "/sophos",
    label: "Sophos",
    category: "cyberSecurity",
    description:
      "Sophos endpoint, firewall, and MDR solutions for comprehensive cyber security.",
    intro:
      "Protect endpoints, email, and networks with Sophos synchronized security. Aptus Infotech delivers Sophos licensing, deployment, and ongoing support for businesses and institutions.",
    features: [
      { title: "Endpoint Protection", body: "Next-gen antivirus, EDR, and device encryption." },
      { title: "Firewall & SD-WAN", body: "XG Firewall with integrated Wi-Fi and SD-WAN options." },
      { title: "Email Security", body: "Anti-phishing and spam protection for Microsoft 365 and Google." },
      { title: "Managed Detection", body: "MDR services for 24/7 threat monitoring and response." },
    ],
  },
  {
    path: "/sonicwall-next-gen-firewall",
    label: "SonicWall Next-Gen Firewall",
    category: "cyberSecurity",
    description:
      "SonicWall TZ and NSa series firewalls with deep packet inspection and VPN.",
    intro:
      "Deploy SonicWall NGFW appliances for SMB and enterprise networks. Aptus Infotech provides sizing, procurement, configuration, and support for SonicWall firewall deployments in Oman.",
    features: [
      { title: "Deep Packet Inspection", body: "Inspect encrypted traffic without degrading performance." },
      { title: "VPN & Remote Access", body: "Secure SSL VPN for remote workers and site-to-site links." },
      { title: "Capture ATP", body: "Cloud-based sandboxing for unknown file analysis." },
      { title: "Wireless Integration", body: "Unified management with SonicWall access points." },
    ],
  },
  {
    path: "/kaspersky",
    label: "Kaspersky",
    category: "cyberSecurity",
    description:
      "Kaspersky endpoint and server protection for businesses and educational institutions.",
    intro:
      "License Kaspersky Endpoint Security for Business through Aptus Infotech. Centralized management, advanced threat defense, and encryption for workstations and servers.",
    features: [
      { title: "Endpoint Security", body: "Multi-layer protection against malware, ransomware, and exploits." },
      { title: "Centralized Console", body: "Kaspersky Security Center for policy and update management." },
      { title: "Server Protection", body: "Specialized agents for Windows and Linux server workloads." },
      { title: "Education Licensing", body: "Academic programs for schools and universities." },
    ],
  },
  {
    path: "/antivirus-and-data-security",
    label: "Antivirus and Data Security",
    category: "cyberSecurity",
    description:
      "Enterprise antivirus, DLP, and data security solutions for regulated industries.",
    intro:
      "Protect sensitive data with enterprise-grade antivirus and data loss prevention. Aptus Infotech assesses your environment and recommends layered security aligned to compliance requirements.",
    features: [
      { title: "Endpoint AV", body: "Real-time malware protection across Windows, macOS, and Linux." },
      { title: "Data Loss Prevention", body: "Monitor and control data movement across endpoints and email." },
      { title: "Encryption", body: "Full-disk and file-level encryption for laptops and removable media." },
      { title: "Compliance Support", body: "Solutions aligned to healthcare, finance, and government standards." },
    ],
  },
  {
    path: "/palo-alto",
    label: "Palo Alto",
    category: "cyberSecurity",
    description:
      "Palo Alto Networks next-generation firewalls and Prisma SASE cloud security.",
    intro:
      "Implement Palo Alto Networks NGFWs and cloud-delivered security with Aptus Infotech. From PA-Series appliances to Prisma Access SASE, we support enterprise security architecture in Oman.",
    features: [
      { title: "App-ID Technology", body: "Identify and control applications regardless of port or protocol." },
      { title: "Threat Prevention", body: "IPS, wildfire sandboxing, and URL filtering in one platform." },
      { title: "Prisma SASE", body: "Cloud-delivered security for remote users and branch offices." },
      { title: "Panorama Management", body: "Centralized policy management across distributed firewalls." },
    ],
  },
  // Educational software
  {
    path: "/ansys",
    label: "ANSYS",
    category: "educational",
    description:
      "ANSYS simulation software for engineering analysis, FEA, CFD, and multiphysics.",
    intro:
      "Aptus Infotech supplies ANSYS academic and commercial licenses for universities and research institutions in Oman. Enable students and engineers with industry-leading simulation tools.",
    features: [
      { title: "FEA & Structural", body: "Mechanical simulation for stress, vibration, and fatigue analysis." },
      { title: "CFD", body: "Fluid flow and heat transfer simulation for diverse applications." },
      { title: "Academic Licensing", body: "Campus-wide and research lab licensing programs." },
      { title: "Training Support", body: "Guidance on curriculum integration and license deployment." },
    ],
  },
  {
    path: "/ibm-spss-software",
    label: "IBM SPSS",
    category: "educational",
    description:
      "IBM SPSS Statistics and Modeler for data analysis, research, and predictive analytics.",
    intro:
      "License IBM SPSS for academic research and institutional analytics. Aptus Infotech provides volume academic licensing with deployment support for labs and faculty.",
    features: [
      { title: "Statistical Analysis", body: "Comprehensive tests, regression, and data visualization." },
      { title: "Predictive Analytics", body: "SPSS Modeler for machine learning and data mining workflows." },
      { title: "Academic Programs", body: "Discounted licensing for universities and training centers." },
      { title: "Multi-User Deployment", body: "Network license and subscription options for computer labs." },
    ],
  },
  {
    path: "/matlab",
    label: "MATLAB",
    category: "educational",
    description:
      "MATLAB and Simulink for engineering computation, simulation, and algorithm development.",
    intro:
      "Equip engineering and science programs with MATLAB and Simulink. Aptus Infotech delivers MathWorks academic licensing with advice on toolbox selection and campus deployment.",
    features: [
      { title: "Numerical Computing", body: "Matrix operations, plotting, and algorithm development." },
      { title: "Simulink", body: "Model-based design for control systems and multidomain simulation." },
      { title: "Toolboxes", body: "Specialized libraries for signal processing, optimization, and ML." },
      { title: "Campus License", body: "Site-wide access for students, faculty, and researchers." },
    ],
  },
  {
    path: "/turnitin",
    label: "Turnitin",
    category: "educational",
    description:
      "Turnitin originality checking and academic integrity tools for institutions.",
    intro:
      "Support academic integrity with Turnitin similarity checking and feedback tools. Aptus Infotech helps schools and universities in Oman license and integrate Turnitin with LMS platforms.",
    features: [
      { title: "Similarity Checking", body: "Compare submissions against web, publications, and student papers." },
      { title: "Feedback Studio", body: "Inline grading and feedback tools for instructors." },
      { title: "LMS Integration", body: "Plugins for Moodle, Blackboard, Canvas, and other platforms." },
      { title: "Institutional Licensing", body: "Site licenses scaled to enrollment and department needs." },
    ],
  },
  // EDMS
  {
    path: "/construction-cloud",
    label: "Autodesk Construction Cloud",
    category: "edms",
    description:
      "Autodesk Construction Cloud for document management, coordination, and field workflows.",
    intro:
      "Connect office and field teams with Autodesk Construction Cloud — Docs, Build, Takeoff, and BIM Collaborate. Aptus Infotech provides ACC licensing and implementation as an authorized Autodesk partner.",
    features: [
      { title: "Document Control", body: "Centralized drawings, models, and specifications with version control." },
      { title: "Design Collaboration", body: "Coordinate models and resolve clashes before construction." },
      { title: "Field Management", body: "RFIs, submittals, photos, and daily logs from mobile devices." },
      { title: "Takeoff & Estimating", body: "Quantity takeoff integrated with project documentation." },
    ],
  },
  {
    path: "/odoo",
    label: "Odoo",
    category: "edms",
    description:
      "Odoo ERP and business applications for CRM, project management, and document workflows.",
    intro:
      "Implement Odoo as your integrated business platform — CRM, sales, project management, accounting, and website. Aptus Infotech supports Odoo licensing, customization, and integration for organizations in Oman.",
    features: [
      { title: "Modular ERP", body: "Start with CRM or projects and expand to full ERP as you grow." },
      { title: "Project & Documents", body: "Task tracking, timesheets, and document attachment workflows." },
      { title: "Website & eCommerce", body: "Built-in CMS and online sales capabilities." },
      { title: "Implementation Partner", body: "Local consulting, customization, and training from Aptus Infotech." },
    ],
  },
  {
    path: "/spectronova",
    label: "SpectroNova",
    category: "edms",
    description:
      "SpectroNova engineering document management for construction and industrial projects.",
    intro:
      "Manage engineering documents, transmittals, and workflows with SpectroNova EDMS. Aptus Infotech supplies licensing and deployment support for project teams requiring structured document control.",
    features: [
      { title: "Document Register", body: "Track revisions, approvals, and distribution lists." },
      { title: "Transmittals", body: "Formal document packages with audit trails for clients and contractors." },
      { title: "Workflow Automation", body: "Review and approval routing aligned to project procedures." },
      { title: "Search & Retrieval", body: "Fast lookup across large project document repositories." },
    ],
  },
];

function buildNavProductPage(def: NavProductPageDef): MarketingPageContent {
  const whyChoose = def.category === "elv" ? ELV_WHY_APTUS : SOFTWARE_WHY_APTUS;

  return {
    metaTitle: `${def.label} | Aptus Infotech`,
    metaDescription: def.description,
    source: "static",
    hero: {
      id: "hero",
      visible: true,
      title: { before: "", accent: def.label },
      subtitle: def.description,
      ctaLabel: "Request a Quote",
      ctaHref: MAILTO,
    },
    intro: {
      id: "intro",
      visible: true,
      title: { before: "Overview", accent: "" },
      paragraphs: [def.intro],
    },
    cardSections: [
      {
        id: "features",
        visible: true,
        eyebrow: "Capabilities",
        title: { before: "Key", accent: "Features" },
        align: "center",
        items: def.features,
      },
      whyChoose,
    ],
    showContactCta: true,
  };
}

export const DEFAULT_NAV_PRODUCT_PAGE_CONTENT: Record<string, MarketingPageContent> =
  Object.fromEntries(
    NAV_PRODUCT_PAGE_DEFS.map((def) => [def.path.replace(/^\//, ""), buildNavProductPage(def)]),
  );

export function getNavProductPageContent(slugPath: string): MarketingPageContent | null {
  const normalized = slugPath.replace(/^\//, "");
  return DEFAULT_NAV_PRODUCT_PAGE_CONTENT[normalized] ?? null;
}

export function getNavProductPagePaths(): string[] {
  return NAV_PRODUCT_PAGE_DEFS.map((def) => def.path.replace(/^\//, ""));
}

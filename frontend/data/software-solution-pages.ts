import { portfolioSolutionTypes } from "@/data/product-portfolio";

export type SoftwareSolutionLink = { label: string; href: string };

export type SoftwareSolutionSection = {
  heading: string;
  body: string;
};

export type SoftwareSolutionPage = {
  label: string;
  slug: string;
  description: string;
  points: readonly string[];
  sections?: readonly SoftwareSolutionSection[];
  closing?: string;
  /** Catalog brands that used to live in this group's flyout. */
  brands: SoftwareSolutionLink[];
};

/** Solution types under Products → Software. Each one is a page, not a flyout. */
export const SOFTWARE_SOLUTION_PAGES: readonly SoftwareSolutionPage[] = [
  {
    label: "Engineering & Construction",
    slug: "engineering-and-construction",
    description:
      "Deliver projects with confidence using industry-leading design, BIM, estimating, and visualization software. Aptus provides genuine software licensing and expert support for architects, engineers, contractors, and construction professionals—helping you manage every stage of a building or infrastructure project, from concept to completion.",
    points: [],
    sections: [
      {
        heading: "Design & BIM",
        body: "Create intelligent designs and coordinated project models with Autodesk's leading design tools, including AutoCAD, Revit, Civil 3D, Navisworks, and Inventor.",
      },
      {
        heading: "Quantity Takeoff & Estimating",
        body: "Improve cost accuracy and streamline project planning with professional estimating solutions such as RIB CostX, Cubicost, and PlanSwift.",
      },
      {
        heading: "Visualization",
        body: "Present designs with confidence using industry-leading visualization software, including Enscape and Lumion, to create realistic renderings, walkthroughs, and immersive project presentations.",
      },
    ],
    closing:
      "Whether you're designing commercial buildings, infrastructure, or industrial facilities, Aptus helps you choose the right software to improve collaboration, reduce project risks, and deliver projects on time and within budget.",
    brands: [
      { label: "RIB", href: "/rib-costx" },
      { label: "Cubicost", href: "/cubicost-bm-qs" },
      { label: "PlanSwift", href: "/plainswift" },
    ],
  },
  {
    label: "Creative & Document Management",
    slug: "creative-and-document-management",
    description:
      "Bring your ideas to life with industry-leading creative, design, and document management solutions. Aptus provides genuine software licensing and expert support for creative professionals, marketing teams, architects, and businesses that create, edit, and share digital content.",
    points: [],
    sections: [
      {
        heading: "Creative Design",
        body: "Create stunning graphics, illustrations, videos, and digital content with Adobe Creative Cloud, including Photoshop, Illustrator, and Premiere Pro—the industry's most trusted creative tools.",
      },
      {
        heading: "PDF & Document Management",
        body: "Create, edit, review, sign, and securely share documents with Adobe Acrobat Pro, making collaboration faster and more efficient across teams.",
      },
      {
        heading: "Architectural Visualization",
        body: "Produce photorealistic renders and high-quality visualizations with Chaos Corona, enabling architects and designers to showcase projects with exceptional realism and detail.",
      },
    ],
    closing:
      "Whether you're creating marketing campaigns, editing videos, managing business documents, or producing architectural visualizations, Aptus helps you choose the right software to boost creativity, streamline collaboration, and improve productivity.",
    brands: [{ label: "Chaos", href: "/chaos-corona" }],
  },
  {
    label: "IT Infrastructure & Cloud",
    slug: "it-infrastructure-and-cloud",
    description:
      "Build a secure, scalable IT environment with enterprise infrastructure and cloud solutions from Aptus. We provide genuine software licensing, deployment, and support to help organizations modernize operations, improve collaboration, and keep business running.",
    points: [],
    sections: [
      {
        heading: "Microsoft 365 & Cloud Collaboration",
        body: "Empower your workforce with Microsoft 365, Teams, SharePoint, and Azure—seamless communication, secure file sharing, cloud productivity, and infrastructure that scales for hybrid and remote work.",
      },
      {
        heading: "Server & Enterprise Infrastructure",
        body: "Build a reliable foundation with Windows Server, Windows 10/11, and Microsoft infrastructure solutions. Manage users, applications, databases, and enterprise workloads with stronger security and performance.",
      },
      {
        heading: "Enterprise Operating Systems",
        body: "Deploy stable, secure server environments with Red Hat Enterprise Linux (RHEL)—built for enterprise applications, virtualization, cloud deployments, and mission-critical workloads.",
      },
    ],
    closing:
      "Whether you're migrating to the cloud, upgrading infrastructure, or building a modern digital workplace, Aptus delivers the right technologies and guidance to keep your business secure, connected, and ready for what's next.",
    brands: [{ label: "Red Hat", href: "/redhat" }],
  },
  {
    label: "Project Management",
    slug: "project-management",
    description:
      "Keep projects on schedule and under control with enterprise project management software from Aptus. We provide genuine licensing and expert support for planning, cost control, and document workflows—so teams deliver with clarity from kickoff to closeout.",
    points: [],
    sections: [
      {
        heading: "Primavera P6 Planning & Scheduling",
        body: "Plan, schedule, and control complex projects with Oracle Primavera P6 Professional and Primavera P6 Enterprise—industry-standard tools for critical path scheduling, resource management, and portfolio visibility.",
      },
      {
        heading: "Project Correspondence & Document Control",
        body: "Manage project communication and controlled documents with Oracle Aconex, keeping correspondence, RFIs, and approvals in one auditable workflow across owners, contractors, and consultants.",
      },
      {
        heading: "Everyday Project Collaboration",
        body: "Support day-to-day project work with Microsoft 365—email, Teams, SharePoint, and shared files that keep project teams aligned alongside formal controls in Primavera and Aconex.",
      },
    ],
    closing:
      "Whether you're running a single capital project or a full portfolio, Aptus helps you choose the right project management software to improve planning accuracy, strengthen document control, and keep stakeholders informed.",
    brands: [],
  },
  {
    label: "Data & Analytics",
    slug: "data-and-analytics",
    description:
      "Turn data into decisions with reporting and database software your teams can trust. Aptus provides genuine software licensing and expert support for organizations that need dashboards, shared datasets, and a reliable data platform behind them.",
    points: [],
    sections: [
      {
        heading: "Reports & Dashboards",
        body: "Build reports, dashboards, and shared datasets with Power BI so teams can see the same numbers and act on them.",
      },
      {
        heading: "Data Platform",
        body: "Keep operational data and the models those reports use on SQL Server, so every dashboard has a dependable database behind it.",
      },
    ],
    closing:
      "Licensing is quoted through Aptus rather than sold as a self-serve checkout. Whether you need reporting, a data platform, or both, Aptus helps you choose the right software to improve visibility and keep your data in one place.",
    brands: [],
  },
  {
    label: "Education Solution",
    slug: "education-solution",
    description:
      "Empower students, educators, and researchers with academic software built for learning, innovation, and research. Aptus provides genuine educational licensing and expert support for universities, colleges, schools, training centers, and research institutions across a wide range of disciplines.",
    points: [],
    sections: [
      {
        heading: "Academic Integrity",
        body: "Promote originality and improve learning outcomes with Turnitin—the leading platform for plagiarism detection, feedback, and academic integrity.",
      },
      {
        heading: "Research & Engineering Software",
        body: "Equip classrooms and research labs with industry-standard tools including MATLAB, IBM SPSS, ANSYS, MSC Adams, and SOLIDWORKS. Support data analysis, simulation, engineering design, and advanced research across STEM disciplines.",
      },
    ],
    closing:
      "Whether you're strengthening academic integrity, equipping a research lab, or teaching engineering design, Aptus helps institutions choose the right educational software and licensing for lasting impact.",
    brands: [
      { label: "Turnitin", href: "/turnitin" },
      { label: "MathWorks", href: "/matlab" },
      { label: "IBM", href: "/ibm-spss-software" },
      { label: "ANSYS", href: "/ansys" },
      { label: "MSC Software", href: "/adams" },
      { label: "Dassault Systèmes", href: "/solidworks" },
    ],
  },
  {
    label: "Education",
    slug: "education",
    description:
      "Adobe Creative Cloud where the portfolio tags it for education, for campuses teaching design, media, and digital content. Research and engineering classroom tools live on the Education Solution page.",
    points: [
      "Creative Cloud for students, faculty, and labs",
      "The same Adobe apps used in professional creative work, on education terms",
      "Kept separate from Turnitin, MATLAB, ANSYS, and the other Education Solution products",
    ],
    brands: [],
  },
  {
    label: "Multimedia",
    slug: "multimedia",
    description:
      "Create immersive visual experiences with industry-leading visualization, rendering, and 3D design software. Aptus provides genuine software licensing, implementation, and expert support for architects, designers, engineers, creative professionals, and visualization studios.",
    points: [],
    sections: [
      {
        heading: "Real-Time Visualization",
        body: "Bring designs to life with Enscape, Lumion, Twinmotion, and D5 Render. Produce real-time walkthroughs, animations, and photorealistic presentations that help clients see the project before construction begins.",
      },
      {
        heading: "3D Modeling & Rendering",
        body: "Design, model, and render with SketchUp for intuitive 3D modeling and V-Ray for production-ready rendering. Create detailed architectural, interior, and product visualizations with exceptional realism.",
      },
      {
        heading: "Flexible Licensing for Teams",
        body: "From individual designers to growing studios and large enterprises, Aptus offers flexible licensing—from single-user seats to multi-seat deployments—with guidance and ongoing technical support.",
      },
    ],
    closing:
      "From architectural visualization and interior design to product rendering and digital content, Aptus delivers the software that helps professionals work faster, present ideas clearly, and create visually stunning results.",
    brands: [
      { label: "Enscape", href: "/enscape" },
      { label: "Lumion", href: "/luminon" },
      { label: "Trimble", href: "/sketchup" },
      { label: "Epic Games", href: "/twinmotion" },
      { label: "Chaos", href: "/v-ray" },
      { label: "D5 Render", href: "/d5-render" },
    ],
  },
  {
    label: "Structural Engineering & Analysis",
    slug: "structural-engineering-and-analysis",
    description:
      "Design safer, stronger, and more efficient structures with industry-leading structural engineering and analysis software. Aptus provides genuine software licensing, implementation, training, and technical support for consulting engineers, contractors, infrastructure professionals, and engineering firms.",
    points: [],
    sections: [
      {
        heading: "Structural Analysis & Design",
        body: "Perform advanced structural analysis and design using CSI solutions, including ETABS, SAP2000, SAFE, and CSiBridge. Model and analyze buildings, bridges, foundations, and complex structures with confidence and precision.",
      },
      {
        heading: "Structural Design Calculations",
        body: "Simplify everyday engineering calculations with PROKON. Design reinforced concrete, steel, timber, and masonry structures while ensuring compliance with international design standards and engineering best practices.",
      },
      {
        heading: "Integrated Building & Structural Design",
        body: "Optimize building and infrastructure projects with CYPE, an integrated platform for structural design, building services (MEP), BIM workflows, and construction documentation.",
      },
    ],
    closing:
      "Whether you're designing high-rise buildings, industrial facilities, bridges, or infrastructure projects, Aptus delivers the software solutions and engineering expertise needed to improve accuracy, enhance collaboration, and accelerate project delivery.",
    brands: [
      { label: "CSI", href: "/computers-structures" },
      { label: "PROKON", href: "/prokon" },
      { label: "CYPE", href: "/cype" },
    ],
  },
  {
    label: "PDF & Document Productivity",
    slug: "pdf-and-document-productivity",
    description:
      "Simplify document creation, editing, and collaboration with PDF productivity solutions built for businesses and professional teams. Aptus provides genuine software licensing and support to help organizations manage documents efficiently, improve workflows, and work together more effectively.",
    points: [],
    sections: [
      {
        heading: "PDF Creation & Editing",
        body: "Create, convert, edit, and manage PDF documents with Nitro PDF. Empower teams to make changes, update files, and finish document tasks without relying on external support.",
      },
      {
        heading: "Document Collaboration",
        body: "Review, comment, combine, and securely share documents across teams. Streamline approvals and keep important information accessible throughout your organization.",
      },
      {
        heading: "Professional Document Workflows",
        body: "From business documents and contracts to technical files and reports, Aptus helps organizations implement reliable PDF solutions that save time and improve efficiency. For construction-specific markup and review, Bluebeam is available under PDF & Construction Collaboration.",
      },
    ],
    closing:
      "Whether you're editing everyday PDFs or standardizing how documents move through your business, Aptus delivers the right productivity tools with genuine licensing and expert support.",
    brands: [{ label: "Nitro", href: "/nitro" }],
  },
  {
    label: "PDF & Construction Collaboration",
    slug: "pdf-and-construction-collaboration",
    description:
      "Improve construction workflows with document review and collaboration tools built for architects, engineers, contractors, and project teams. Aptus provides genuine software licensing and support for solutions that simplify drawing reviews, markups, measurements, and project communication.",
    points: [],
    sections: [
      {
        heading: "Construction Drawing Review & Markup",
        body: "Use Bluebeam Revu to review project drawings, add markups, create comments, and coordinate updates across teams in a centralized document workflow.",
      },
      {
        heading: "Measurement & Quantity Verification",
        body: "Measure lengths, areas, and quantities directly from digital drawings—helping teams improve accuracy during planning, estimation, and construction.",
      },
      {
        heading: "Seamless Project Collaboration",
        body: "Connect design, engineering, and construction teams by integrating document review with your existing project tools. Bluebeam Revu works alongside Engineering & Construction design solutions to enhance collaboration—not replace them.",
      },
    ],
    closing:
      "Whether you're managing architectural drawings, engineering documents, or construction workflows, Aptus helps your teams communicate better, reduce errors, and keep projects moving efficiently.",
    brands: [{ label: "Bluebeam", href: "/bluebeam" }],
  },
  {
    label: "Cybersecurity",
    slug: "cybersecurity",
    description:
      "Protect your business with advanced cybersecurity solutions designed to secure networks, endpoints, applications, and critical data. Aptus provides genuine security software licensing, implementation, and support to help organizations defend against evolving cyber threats and maintain business continuity.",
    points: [],
    sections: [
      {
        heading: "Network Security",
        body: "Strengthen your digital infrastructure with leading network security solutions from Fortinet and Palo Alto Networks. Protect your network perimeter, secure traffic, and improve visibility with advanced threat prevention technologies.",
      },
      {
        heading: "Endpoint Protection",
        body: "Safeguard devices, users, and business data with endpoint security solutions from Kaspersky and Broadcom Symantec. Detect threats, prevent attacks, and enhance security across laptops, desktops, and enterprise endpoints.",
      },
      {
        heading: "Disaster Recovery & Business Continuity",
        body: "Minimize downtime and recover quickly from unexpected incidents with Quorum disaster recovery solutions. Ensure critical systems and data remain protected with reliable backup and recovery capabilities.",
      },
    ],
    closing:
      "From network protection and endpoint security to disaster recovery planning, Aptus helps organizations build a resilient cybersecurity strategy that protects their operations, data, and reputation.",
    brands: [
      { label: "Fortinet", href: "/fortinet" },
      { label: "Kaspersky", href: "/kaspersky" },
      { label: "Broadcom", href: "/antivirus-and-data-security" },
      { label: "Palo Alto Networks", href: "/palo-alto" },
      { label: "Quorum", href: "/quorum" },
    ],
  },
  {
    label: "Electrical Engineering & Power Systems",
    slug: "electrical-engineering-and-power-systems",
    description:
      "Design, analyze, and optimize electrical power systems with engineering software built for modern energy infrastructure. Aptus provides genuine software licensing and technical support for electrical consultants, design offices, industrial facilities, and owner engineering teams.",
    points: [],
    sections: [
      {
        heading: "Power System Modeling & Analysis",
        body: "Develop accurate electrical system models for generation, transmission, distribution, and industrial power networks using ETAP. Analyze system performance and make informed engineering decisions with confidence.",
      },
      {
        heading: "Electrical Studies & Simulation",
        body: "Run critical power system studies—including load flow, short circuit, protection coordination, arc flash, and reliability assessments—in a unified engineering environment.",
      },
      {
        heading: "Professional Engineering Solutions",
        body: "Support complex electrical projects with tools built for consulting engineers, utilities, and industrial organizations. Aptus helps teams improve design accuracy, reduce risk, and optimize power system performance.",
      },
    ],
    closing:
      "Whether you're designing new electrical infrastructure or analyzing existing networks, Aptus delivers the software needed for safer, more efficient, and more reliable power systems.",
    brands: [{ label: "ETAP", href: "/etap" }],
  },
  {
    label: "EDMS & Document Management",
    slug: "edms-and-document-management",
    description:
      "Manage engineering documents with structured document management solutions built for controlled drawings, revisions, approvals, and project records. Aptus provides reliable software and support to help engineering and project teams maintain accuracy, compliance, and collaboration throughout the project lifecycle.",
    points: [],
    sections: [
      {
        heading: "Controlled Document Management",
        body: "Organize and manage issued drawings, revisions, technical documents, and project records through a centralized, controlled document register.",
      },
      {
        heading: "Improved Project Collaboration",
        body: "Give project teams a single source of truth to access the latest approved documents quickly, reduce errors, and ensure everyone works from the correct information.",
      },
      {
        heading: "Integration with Design Workflows",
        body: "Enhance existing engineering processes by working alongside design and authoring tools. SpectroNova supports document control and management without replacing the software used to create project content.",
      },
    ],
    closing:
      "Whether you're managing engineering drawings, construction documents, or complex project records, Aptus helps organizations improve document visibility, maintain compliance, and streamline collaboration.",
    brands: [{ label: "SpectroNova", href: "/spectronova" }],
  },
];

export function softwareSolutionHref(slug: string): string {
  return `/software-solutions/solutions/${slug}`;
}

export function softwareSolutionBySlug(slug: string): SoftwareSolutionPage | undefined {
  return SOFTWARE_SOLUTION_PAGES.find((page) => page.slug === slug);
}

const pageLabels = SOFTWARE_SOLUTION_PAGES.map((page) => page.label).sort();
const excelLabels = portfolioSolutionTypes();
const flyoutBrandCount = SOFTWARE_SOLUTION_PAGES.reduce((count, page) => count + page.brands.length, 0);
if (pageLabels.join("|") !== excelLabels.join("|") || flyoutBrandCount !== 29) {
  throw new Error(
    `Software solution pages must match the portfolio types and keep 29 catalog brands, got ${pageLabels.length} types / ${flyoutBrandCount} brands`,
  );
}

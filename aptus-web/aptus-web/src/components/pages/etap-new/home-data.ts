import { ETAP_HOME_ASSETS, etapAsset } from "./assets";

export type HeroSlide = {
  id: string;
  image: string;
  thumb?: string;
  position: "Left" | "Center" | "Right";
  blocks: Array<
    | { type: "logo"; src: string; alt?: string }
    | { type: "demo-title"; html: string }
    | { type: "heading"; tag: "h2" | "h3" | "h4"; html: string }
    | { type: "text"; html: string }
    | { type: "cta"; label: string; href: string; large?: boolean }
  >;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "etap-2026",
    image: ETAP_HOME_ASSETS.heroSlides.bgBanner,
    thumb: ETAP_HOME_ASSETS.heroSlides.thumbPlaceholder,
    position: "Left",
    blocks: [
      { type: "logo", src: ETAP_HOME_ASSETS.heroSlides.etap2026Logo, alt: "ETAP 2026" },
      { type: "heading", tag: "h3", html: "Continuous Energy Intelligence" },
      { type: "text", html: "ETAP 2026 Available now!" },
      { type: "cta", label: "Learn more", href: "https://etap.com/product-releases/etap-2026-release" },
    ],
  },
  {
    id: "utilities-whitepaper",
    image: ETAP_HOME_ASSETS.heroSlides.utilitiesBanner,
    thumb: ETAP_HOME_ASSETS.heroSlides.thumbPlaceholder,
    position: "Left",
    blocks: [
      {
        type: "demo-title",
        html: "From Reactive Grids<br>to Predictive Intelligence",
      },
      {
        type: "heading",
        tag: "h3",
        html: "AI-driven tools and digital twins are <br>transforming utility operations",
      },
      {
        type: "cta",
        label: "Download the White Paper",
        href: "https://etap.com/lp/reactive-grids-promotion",
        large: true,
      },
    ],
  },
  {
    id: "demo",
    image: ETAP_HOME_ASSETS.heroSlides.etapDemo,
    thumb: ETAP_HOME_ASSETS.heroSlides.thumbPlaceholder,
    position: "Left",
    blocks: [
      { type: "demo-title", html: '<a href="https://etap.com/demo-request">Try our software</a>' },
      { type: "heading", tag: "h3", html: '<a href="https://etap.com/demo-request">Free 30-day software demos</a>' },
      { type: "text", html: "Explore ETAP, SEE and CANECO products, features and functionalities today!" },
      { type: "cta", label: "Get started", href: "https://etap.com/demo-request", large: true },
    ],
  },
  {
    id: "webinar-2026",
    image: ETAP_HOME_ASSETS.heroSlides.etap2026Banner,
    thumb: ETAP_HOME_ASSETS.heroSlides.thumbPlaceholder,
    position: "Left",
    blocks: [
      { type: "logo", src: ETAP_HOME_ASSETS.heroSlides.webinarLogo, alt: "2026 Webinar Series" },
      {
        type: "heading",
        tag: "h3",
        html: '<a href="https://etap.com/events/events-schedule?type=Webinar&page=1">Explore new features & functionality in ETAP 2026</a>',
      },
      { type: "heading", tag: "h4", html: "Overview of the latest enhancements and entirely new modules" },
      { type: "text", html: "Wednesday, July 8 and Thursday, July 9 | Presented in English" },
      { type: "cta", label: "Register today", href: "https://etap.com/events/events-schedule?type=Webinar&page=1", large: true },
    ],
  },
];

export const NAV_ITEMS = [
  {
    label: "Solutions",
    mega: true,
    columns: [
      {
        header: "Design",
        links: [
          { label: "Low Voltage Electrical Design", href: "https://etap.com/product/caneco" },
          { label: "System Modeling & Visualization", href: "https://etap.com/solutions/system-modeling-visualization" },
          { label: "Arc Flash Safety", href: "https://etap.com/solutions/arcflash" },
          { label: "Grid Code Compliance", href: "https://etap.com/solutions/gridcode" },
        ],
      },
      {
        header: "Operate",
        links: [
          { label: "Power Management System", href: "https://etap.com/packages/monitoring-simulation" },
          { label: "Energy Management System", href: "https://etap.com/packages/energy-management-system" },
          { label: "Electrical SCADA", href: "https://etap.com/packages/electrical-scada" },
        ],
      },
      {
        header: "Digital Transformation",
        links: [
          { label: "ETAP Digital Twin", href: "https://etap.com/products/etap-digital-twin" },
          { label: "Intelligent Single-Line Diagram", href: "https://etap.com/solutions/intelligent-single-line-diagram" },
          { label: "Sustainability", href: "https://etap.com/company/sustainable-energy-transition" },
        ],
      },
    ],
    sidebar: {
      image: ETAP_HOME_ASSETS.navCatalog,
      imageAlt: "ETAP Solutions Catalog",
      linkLabel: "View Catalog",
      linkHref: "https://etap.com/docs/default-source/brochures/etap-solutions-overview.pdf",
    },
  },
  {
    label: "Industries",
    links: [
      { label: "Engineering Consulting", href: "https://etap.com/industries/consulting-firms" },
      { label: "Data Centers", href: "https://etap.com/industries/data-center" },
      { label: "Energy & Chemicals", href: "https://etap.com/industries/oil-gas" },
      { label: "Transportation", href: "https://etap.com/industries/transportation" },
      { label: "Manufacturing", href: "https://etap.com/industries/manufacturing" },
      { label: "Renewables", href: "https://etap.com/industries/renewable-energy" },
      { label: "Utility Distribution", href: "https://etap.com/industries/utility-distribution" },
    ],
  },
  {
    label: "Products",
    mega: true,
    columns: [
      {
        header: "Electrical Network Design",
        links: [
          { label: "ETAP Power Simulator", href: "https://etap.com/power-simulator" },
          { label: "Caneco", href: "https://etap.com/product/caneco" },
          { label: "Caneco BT", href: "https://etap.com/product/caneco-bt" },
        ],
      },
      {
        header: "Analysis & Simulation",
        links: [
          { label: "ETAP Arc Flash", href: "https://etap.com/solutions/arcflash" },
          { label: "ETAP Power Flow", href: "https://etap.com/product/load-flow-software" },
          { label: "ETAP Dynamics & Transients", href: "https://etap.com/product/transient-stability-software" },
        ],
      },
      {
        header: "Operate & Maintain",
        links: [
          { label: "ETAP SCADA", href: "https://etap.com/packages/electrical-scada" },
          { label: "ETAP ADMS", href: "https://etap.com/solutions/advanced-distribution-management-system" },
          { label: "ETAP Power Management System", href: "https://etap.com/packages/monitoring-simulation" },
        ],
      },
    ],
    sidebar: {
      image: ETAP_HOME_ASSETS.navNewsIcon,
      imageAlt: "ETAP 2026 Release",
      linkLabel: "View Detail",
      linkHref: "https://etap.com/product-releases/etap-2026-release",
    },
  },
  { label: "Events", links: [{ label: "Events Schedule", href: "https://etap.com/events/events-schedule" }, { label: "User Groups", href: "https://etap.com/events/user-groups" }] },
  { label: "Resources", links: [{ label: "Resource Center", href: "https://etap.com/resources" }, { label: "Case Studies", href: "https://etap.com/case-study" }, { label: "Blogs", href: "https://etap.com/blog" }] },
  { label: "Support", links: [{ label: "Sales Support", href: "https://etap.com/products/sales" }, { label: "Technical Support", href: "https://etap.com/support/technical-support" }] },
  { label: "Services", links: [{ label: "Analytical Services", href: "https://etap.com/services/analytical-services" }, { label: "System Integration", href: "https://etap.com/services/system-integration-automation" }] },
  { label: "Company", links: [{ label: "About Us", href: "https://etap.com/company/about-us" }, { label: "Contact Us", href: "/contact-us" }, { label: "News", href: "https://etap.com/company/news" }] },
];

export const INDUSTRIES = [
  { title: "Engineering Consulting", image: etapAsset("etap-engineering-consulting_85924038-6281-4020-b279-962a08f51a90.png"), href: "https://etap.com/industries/consulting-firms" },
  { title: "Data Centers", image: etapAsset("data-centers.png"), href: "https://etap.com/industries/data-center" },
  { title: "Energy and Chemicals", image: etapAsset("oil-gas_8fb71d5f-d1ce-462e-8212-ebfe8e6dc2ee.png"), href: "https://etap.com/industries/oil-gas" },
  { title: "Transportation", image: etapAsset("systems-transportation.png"), href: "https://etap.com/industries/transportation" },
  { title: "Manufacturing", image: etapAsset("manufacturing-icon_22198ab3-d3c1-4cb2-83be-d1109c166e40.png"), href: "https://etap.com/industries/manufacturing" },
  { title: "Fossil Fuel Generation", image: etapAsset("power-generation-icon_7d20d4cc-d0ff-4d8c-948d-f82b649cd9d6.png"), href: "https://etap.com/industries/generation-plants" },
  { title: "Metals & Mining", image: etapAsset("metals-mining-icon_d9ce865d-6c22-43a9-a340-45427052be32.png"), href: "https://etap.com/industries/metals-mining" },
  { title: "Nuclear Generation", image: etapAsset("nuclear-power-generation-icon_d9336e80-c8e6-422c-9e75-fd246eb9d9f5.png"), href: "https://etap.com/industries/nuclear-generation" },
  { title: "Renewables", image: etapAsset("etap-renewable-energy-icon_ae38ee5a-8eec-4eb8-9425-9ab53fc76e10.png"), href: "https://etap.com/industries/renewable-energy" },
  { title: "Utility Distribution", image: etapAsset("utility-distribution-icon_699ec056-01c1-4df1-b7b7-17ac84c55c52.png"), href: "https://etap.com/industries/utility-distribution" },
  { title: "Utility Transmission", image: etapAsset("utility-transmission-1_a15cd5c1-1555-4630-b220-2f5532d416bd.png"), href: "https://etap.com/industries/utility-transmission" },
  { title: "Government & Defense", image: etapAsset("government-defense-facilities_f795d055-ccdd-464a-aa3a-6af8362221ba.png"), href: "https://etap.com/industries/government-defense" },
  { title: "Academia", image: etapAsset("education-icon_242cdc3b-e0e4-43dc-9b03-04dff1a934f7.png"), href: "https://etap.com/industries/academia" },
];

export const PRODUCTS = [
  {
    title: "ETAP SOLUTIONS",
    image: ETAP_HOME_ASSETS.products.etap,
    description:
      'Full lifecycle, modular energy management solution with a unified electrical digital twin for modern power system design, analysis, operations and automation <a href="https://etap.com/product?options=40832a46-0c28-6c02-8629-ff09005ae238">Learn more</a>',
    cta: { label: "Start your free trial", href: "https://etap.com/demo-request" },
  },
  {
    title: "SEE SOLUTIONS",
    image: ETAP_HOME_ASSETS.products.see,
    description:
      'Intuitive and modular software for the design, engineering and manufacturing of electrical systems <a href="https://etap.com/product?options=51452a46-0c28-6c02-8629-ff09005ae238">Learn more</a>',
    cta: { label: "Start your free trial", href: "https://etap.com/demo-request#download" },
  },
  {
    title: "CANECO SOLUTIONS",
    image: ETAP_HOME_ASSETS.products.caneco,
    description:
      'Intuitive and modular electrical network design software with integrated regional standards <a href="https://etap.com/product?options=d83c2a46-0c28-6c02-8629-ff09005ae238">Learn more</a>',
    cta: { label: "Get a personalized demonstration", href: "https://etap.com/demo-request#caneco" },
  },
];

export const NEWS_ITEMS = [
  { date: "May 21, 2026", category: "Product Releases", title: "ETAP Announces ETAP 2026 – Powering Continuous Energy Intelligence", href: "https://etap.com/company/news/2026/05/21/etap-announces-etap-2026-powering-continuous-energy-intelligence" },
  { date: "Apr 28, 2026", category: "Product Releases", title: "New Library Updates – Caneco & SEE Solutions", href: "https://etap.com/company/news/2026/04/28/new-library-updates-caneco-see-solutions" },
  { date: "Feb 27, 2026", category: "Corporate News", title: "Strategic partnership with RINA", href: "https://etap.com/company/news/2026/02/27/strategic-partnership-with-rina" },
  { date: "Oct 2, 2025", category: "Product Releases", title: "New 2025 Hager catalogues for France, Belgium, Germany, Spain, Portugal and Africa for Caneco BT", href: "https://etap.com/company/news/2025/10/02/the-new-2025-hager-catalogues-for-france--belgium--germany--spain-and-portugal-for-caneco-bt-are-available-!" },
];

export const EVENT_ITEMS = [
  { location: "Virtual", title: "ETAP 2026 Release Webinar Series", href: "https://etap.com/events/events-schedule?type=Webinar&page=1" },
  { location: "Global", title: "ETAP Spark - Regional User Conferences", href: "https://etap.com/events/conferences-summits/global/2026/etap-spark-2026" },
  { location: "Virtual", title: "Nuclear Utility Conference", href: "https://etap.com/events/nuclear-user-groups" },
];

export const VIDEO_ITEMS = [
  { title: "Explore ETAP Power System Monitoring and Simulation (PSMS™)", image: ETAP_HOME_ASSETS.videos.psms, href: "https://www.youtube.com/embed/HhNrZQjTCLQ" },
  { title: "Learn about ETAP eSCADA - An Intelligent Alternative to Traditional SCADA", image: ETAP_HOME_ASSETS.videos.escada, href: "https://www.youtube.com/embed/MzHanx1Diy0" },
  { title: "How to Visualize ZSI Schemes in ETAP", image: ETAP_HOME_ASSETS.videos.zsi, href: "https://www.youtube.com/embed/k3zWnWYWnjI" },
  { title: "Distribution Automation with Model-Based Volt/Var Optimization (VVO)", image: ETAP_HOME_ASSETS.videos.voltVar, href: "https://www.youtube.com/embed/IIz5UTSQGkk" },
];

export const TESTIMONIALS = [
  { logo: etapAsset("duke-energy-logo.png"), company: "Duke Energy", quote: "ETAP is a powerful piece of software and extremely user-friendly. The one-line Graphical User Interface makes modeling easy. Furthermore, ETAP engineers are very helpful and responsive." },
  { logo: etapAsset("novec-logo.png"), company: "NOVEC", quote: "ETAP has been our standard software tool for performing power system studies for many years." },
  { logo: etapAsset("exelon-logo.png"), company: "Exelon", quote: "ETAP is the most comprehensive analysis platform for the design, simulation, operation, and automation of generation, transmission, distribution, and industrial power systems." },
  { logo: etapAsset("parsons-logo.png"), company: "Parsons", quote: "We have been using ETAP for over a decade. It is an essential tool for our engineering team." },
  { logo: etapAsset("dominion-logo.png"), company: "Dominion Energy", quote: "ETAP provides the modeling accuracy and depth of analysis needed for our complex power systems." },
  { logo: etapAsset("first-energy-logo.png"), company: "FirstEnergy", quote: "ETAP is an integral part of our protection and coordination studies workflow." },
];

export type EtapHomeNavbarCta = { label: string; href: string };
export type EtapHomeIndustry = { title: string; image: string; href: string };
export type EtapHomeTestimonial = { logo: string; company: string; quote: string };

export const DEFAULT_ETAP_HOME_NAVBAR = {
  aptusLogo: ETAP_HOME_ASSETS.logoAptus,
  aptusLogoAlt: "Aptus Infotech",
  etapLogo: ETAP_HOME_ASSETS.logoEtap,
  etapLogoAlt: "ETAP",
  primaryCta: { label: "Request Demo", href: "/contact-us" },
  secondaryCta: { label: "Get Pricing", href: "/contact-us" },
} as const;

export const DEFAULT_ETAP_HOME_INTRO = {
  headlineHtml: 'The energy transition has started. <span class="accent">ETAP</span> accelerates it.',
  videoHref: "https://etap.com/videos/default-source/corporate-video/ca3939_etapcorpvideo_2024_v8.mp4",
  subtitleHtml:
    'Solutions for electrical systems from <span class="accent">design and engineering to operations and maintenance</span>',
  bodyHtml:
    "ETAP® provides market-leading software and hardware solutions serving all stages of the electrical system lifecycle for utilities, infrastructure, industries and buildings. Through its integrated electrical digital twin platform, ETAP delivers best-in-class, seamless customer experience and cloud-ready technology. ETAP solutions enable universal accessibility for designers, engineers, and operators to accelerate their digital energy transformation, even in the highest regulated environments.",
};

export const DEFAULT_ETAP_HOME_PRICING = {
  image: ETAP_HOME_ASSETS.pricingDashboard,
  imageAlt: "power-simulator-dashboard",
  title: "It's easier than ever to request pricing.",
  description:
    "Get a customized quote in a few simple steps for Caneco, ETAP and SEE subscription bundles. Find the bundle that's right for your business.",
  ctaHref: "https://etap.com/power-simulator",
  ctaLabel: "Get pricing",
};

export const DEFAULT_ETAP_HOME_LEARNING = {
  text: "Explore learning opportunities for electrical and power professionals: training, workshops, webinars, and conferences.",
  ctaLabel: "ETAP Learning Center",
  ctaHref: "https://etap.com/learning",
} as const;

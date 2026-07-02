// ─── Presentation / Design Governance ────────────────────────────────────────
// Odoo stores enum presets only — never raw CSS values.
// Next.js translates these into predefined design-system classes/tokens.
export type CmsTheme = "light" | "dark";
export type CmsAlignment = "left" | "center" | "right";
export type CmsFontPreset = "inter" | "poppins" | "manrope";
export type CmsFontScale = "small" | "medium" | "large";
export type CmsColorPreset = "brand-blue" | "brand-green" | "brand-purple";
export type CmsComponentVariant = "standard" | "compact" | "featured";

export interface CmsPresentationSettings {
  theme?: CmsTheme;
  alignment?: CmsAlignment;
  fontPreset?: CmsFontPreset;
  fontScale?: CmsFontScale;
  colorPreset?: CmsColorPreset;
  variant?: CmsComponentVariant;
  /** When false, SectionRenderer skips this section entirely. */
  visible?: boolean;
}

// ─── Section type registry ───────────────────────────────────────────────────
export type SectionType =
  | "hero"
  | "hero-slider"
  | "banner"
  | "feature-row"
  | "page-header"
  | "page-title"
  | "rich-text"
  | "logo-grid"
  | "team"
  | "contact"
  | "features"
  | "services"
  | "key-enablers"
  | "cta"
  | "testimonials"
  | "faq"
  | "flip-cards"
  | "policy-panel"
  | "why-panel"
  | "iso-panel"
  | "career-panel"
  | "software-landing-hero"
  | "software-inner-hero";

// ─── Primitives ───────────────────────────────────────────────────────────────
export interface ActionLink {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
}

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface SocialLink {
  platform: "facebook" | "linkedin" | "twitter" | "whatsapp" | "youtube" | string;
  href: string;
  label?: string;
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
export interface SEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavigationItem {
  label: string;
  href?: string;
  children?: NavigationItem[];
}

// ─── Site Config ──────────────────────────────────────────────────────────────
export interface TopBar {
  phone?: string;
  email?: string;
  socialLinks?: SocialLink[];
}

export interface FooterColumn {
  title?: string;
  links: ActionLink[];
}

export interface SiteConfig {
  name: string;
  logo?: MediaAsset;
  topBar?: TopBar;
  navigation: NavigationItem[];
  footer: {
    logo?: MediaAsset;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    mapEmbedUrl?: string;
    columns: FooterColumn[];
    socialLinks?: SocialLink[];
    copyright?: string;
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export interface Page {
  id: string;
  slug: string;
  title: string;
  seo: SEO;
  sections: Section[];
  publishedAt?: string;
  updatedAt?: string;
}

export interface Section {
  id: string;
  type: SectionType;
  order: number;
  /** When false, SectionRenderer skips rendering this section. Controlled by Odoo. */
  visible?: boolean;
  /** Controlled design settings from Odoo — presets only, never raw CSS. */
  presentation?: CmsPresentationSettings;
  data:
    | Hero
    | HeroSlider
    | Banner
    | FeatureRow
    | PageHeader
    | PageTitle
    | RichText
    | LogoGrid
    | Team
    | Contact
    | Features
    | Services
    | KeyEnablers
    | CTA
    | Testimonials
    | FAQ
    | FlipCards
    | PolicyPanel
    | WhyPanel
    | IsoPanel
    | CareerPanel
    | SoftwareLandingHero
    | SoftwareInnerHero;
}

// ─── Section data models ──────────────────────────────────────────────────────

// hero
export interface Hero {
  type: "hero";
  heading?: string;
  subheading?: string;
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
  media?: MediaAsset;
}

// hero-slider
export interface HeroSlide {
  id: string;
  label?: string;
  heading?: string;
  headingAccent?: string;
  description?: string;
  action?: ActionLink;
  media?: MediaAsset;
}

export interface HeroSlider {
  type: "hero-slider";
  slides?: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
}

// banner — full-width brand image strip (e.g. "25 Years")
export interface Banner {
  type: "banner";
  media?: MediaAsset;
  heading?: string;
  href?: string;
}

// feature-row — alternating image + text block
export interface FeatureRow {
  type: "feature-row";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  headingAfter?: string;
  description?: string;
  paragraphs?: string[];
  media?: MediaAsset;
  imagePosition?: "left" | "right" | "below";
  action?: ActionLink;
  /** When true, renders the heading as h1 (inner pages like Our Story). */
  headingAsH1?: boolean;
  bullets?: string[];
  /** `boxed` = tinted panel + image (Winning Together). `panel` = gray card row (Why Aptus). */
  variant?: "default" | "boxed" | "panel";
}

// page-header — inner-page hero band with title + breadcrumb image
export interface PageHeader {
  type: "page-header";
  title?: string;
  subtitle?: string;
  media?: MediaAsset;
}

// page-title — centered H1 below a banner (Winning Together, etc.)
export interface PageTitle {
  type: "page-title";
  title?: string;
}

// rich-text — heading + paragraphs / bullet list block
export interface RichText {
  type: "rich-text";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  paragraphs?: string[];
  bullets?: string[];
  media?: MediaAsset;
  imagePosition?: "left" | "right" | "below";
  background?: "white" | "light";
  /** `culture-panel` = Our Team tinted block (watermark + subtitle + photo). */
  variant?: "default" | "culture-panel" | "policy-panel";
}

// logo-grid — partner / brand logo wall
export interface LogoItem {
  id: string;
  src: string;
  alt: string;
}
export interface LogoGrid {
  type: "logo-grid";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  items?: LogoItem[];
  /** `alliances` = live partner logo carousel (277px slides, infinite scroll). */
  variant?: "default" | "alliances" | "alliances-grid";
}

export interface FlipCardItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: "blue" | "green";
}

export interface FlipCards {
  type: "flip-cards";
  spotlight?: { title: string; icon?: string };
  items?: FlipCardItem[];
}

export interface PolicyPanelRow {
  paragraphs?: string[];
  media?: MediaAsset;
  imagePosition?: "left" | "right";
  /** Live Elementor image width hint, e.g. `w-[79%]`. */
  imageWidth?: string;
}

export interface PolicyPanel {
  type: "policy-panel";
  modusTitle?: string;
  infographic?: MediaAsset;
  qualificationHeading?: string;
  qualificationHeadingAccent?: string;
  rows: PolicyPanelRow[];
  privacyHeading?: string;
  privacyParagraphs?: string[];
}

export interface WhyPanelRow {
  heading?: string;
  bullets?: string[];
  media?: MediaAsset;
  imagePosition?: "left" | "right";
}

export interface WhyPanel {
  type: "why-panel";
  title?: string;
  rows: WhyPanelRow[];
  privacyHeading?: string;
  privacyMedia?: MediaAsset;
}

export interface IsoCertificate {
  heading?: string;
  headingAccent?: string;
  media?: MediaAsset;
  downloadHref?: string;
}

export interface IsoPanel {
  type: "iso-panel";
  title?: string;
  subtitle?: string;
  introHeading?: string;
  introParagraphs?: string[];
  coreHeading?: string;
  coreItems?: string[];
  certificates: IsoCertificate[];
  footerParagraphs?: string[];
}

export interface CareerPanel {
  type: "career-panel";
  title?: string;
  tagline?: string;
  paragraphs?: string[];
}

// team — people grid
export interface TeamMember {
  id: string;
  name?: string;
  role?: string;
  bio?: string;
  avatar?: MediaAsset;
}
export interface Team {
  type: "team";
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  members?: TeamMember[];
  /** `leadership` = Our Team page: side-by-side profile cards (post-1230). */
  variant?: "default" | "leadership";
}

// contact — contact details + map / form CTA
export interface Contact {
  type: "contact";
  eyebrow?: string;
  heading?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  mapEmbedUrl?: string;
  /** Live `/contact-us` — 50/50 info + map band (post-3421). */
  variant?: "contact-page";
}

// software-landing-hero — category hub band (/autodesk)
export interface SoftwareLandingHeroAction {
  label: string;
  href: string;
  tone?: "blue" | "green" | "sky";
}

export interface SoftwareLandingHero {
  type: "software-landing-hero";
  title?: string;
  tagline?: string;
  highlight?: string;
  media?: MediaAsset;
  actions?: SoftwareLandingHeroAction[];
}

/** Autodesk/Adobe inner product band — sidebar + copy + image (live post-2030). */
export interface SoftwareInnerHero {
  type: "software-inner-hero";
  /** Dark gradient band above the 3-column layout (live post-2031). */
  bannerTitle?: string;
  bannerTagline?: string;
  /** ETAP / Microsoft stacked pages — H1 above intro panel (live post-2780). */
  pageTitle?: string;
  bannerAction?: ActionLink;
  title?: string;
  paragraphs?: string[];
  media?: MediaAsset;
  action?: ActionLink;
  /** Software vendor family — drives sidebar subnav. */
  family?: string;
  /** Explicit sidebar links (Odoo JSON); overrides family lookup when set. */
  subnavLinks?: { label: string; href: string }[];
  /** ETAP-style 50/50 sidebar + copy (no third media column). */
  layout?: "default" | "two-column";
  /** Logo/infographic below copy instead of a third grid column (Adobe Business Creative). */
  mediaInline?: boolean;
  /** CYPE-style paired text + logo rows inside the gray intro panel. */
  introRows?: {
    paragraphs?: string[];
    media?: MediaAsset;
    imagePosition?: "left" | "right";
  }[];
  /** Live CYPE uses h2 for the page title above the intro panel. */
  titleLevel?: "h1" | "h2";
}

// features
export interface FeatureItem {
  id: string;
  title?: string;
  description?: string;
  bullets?: string[];
  icon?: string;
  media?: MediaAsset;
  href?: string;
  hrefLabel?: string;
  action?: ActionLink;
}

export interface Features {
  type: "features";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  subheading?: string;
  items?: FeatureItem[];
  align?: "left" | "center";
  anchorId?: string;
  /** `pillars` = icon + title columns (Winning Together). */
  variant?: "default" | "pillars" | "product-cards" | "value-cards" | "icon-cards" | "bullet-list" | "checklist";
  /** Product hub grids: live uses 3-col (Microsoft core) or 4-col (Adobe hub). Stacked pages use 5. */
  gridColumns?: 3 | 4 | 5;
}

// services
export interface ServiceItem {
  id: string;
  label?: string;
  title?: string;
  description?: string;
  icon?: string;
  media?: MediaAsset;
  action?: ActionLink;
}

export interface Services {
  type: "services";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  items?: ServiceItem[];
}

// key-enablers
export interface KeyEnablerItem {
  id: string;
  number?: string;
  title?: string;
  description?: string;
}

export interface KeyEnablers {
  type: "key-enablers";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  subheading?: string;
  items?: KeyEnablerItem[];
}

// cta
export interface CTA {
  type: "cta";
  heading?: string;
  description?: string;
  action?: ActionLink;
  showForm?: boolean;
  submitLabel?: string;
  formVariant?: "simple" | "contact" | "career" | "software-quote";
  /** `light` = pale green band + white form card (live About pages). */
  layout?: "dark" | "light" | "career" | "contact-page" | "software-mid";
}

// testimonials
export interface TestimonialItem {
  id: string;
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  avatar?: MediaAsset;
}

export interface Testimonials {
  type: "testimonials";
  heading?: string;
  subheading?: string;
  items?: TestimonialItem[];
  /** `software-quotes` = light 3-column grid on product pages. */
  variant?: "default" | "software-quotes";
}

// faq
export interface FaqItem {
  id: string;
  question?: string;
  answer?: string;
}

export interface FAQ {
  type: "faq";
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  items?: FaqItem[];
}

// ─── Odoo JSON-RPC wire types ─────────────────────────────────────────────────

/** Raw `website.page` record returned by Odoo search_read */
export interface OdooRawPage {
  id: number;
  name: string;
  /** URL key — typically "/slug" or "/" for home */
  url: string;
  is_published: boolean;
  website_published: boolean;
  website_meta_title: string | false;
  website_meta_description: string | false;
  website_meta_keywords: string | false;
  website_meta_og_img: string | false;
  /** [id, display_name] */
  view_id: [number, string] | false;
  /** [id, display_name] */
  website_id: [number, string] | false;
  date_publish: string | false;
  write_date: string | false;
  create_date: string | false;
  /** Custom Next.js content fields (aptus-web schema). Present on specific pages only. */
  x_homepage_sections_json?: string | false;
  x_page_sections_json?: string | false;
  x_case_studies_sections_json?: string | false;
}

/** Raw `ir.ui.view` record (the QWeb arch source) */
export interface OdooRawView {
  id: number;
  name: string;
  /** Full QWeb XML template */
  arch: string;
  arch_base: string;
  type: string;
}

/** Raw `website.menu` record */
export interface OdooRawMenu {
  id: number;
  name: string;
  url: string | false;
  parent_id: [number, string] | false;
  child_id: number[];
  sequence: number;
  is_mega_menu: boolean;
  /** [id, display_name] */
  website_id: [number, string] | false;
}

/** Raw `res.website` record */
export interface OdooRawWebsite {
  id: number;
  name: string;
  domain: string | false;
  favicon: string | false;
  logo: string | false;
}

/** JSON-RPC 2.0 error payload returned by Odoo */
export interface OdooRpcErrorData {
  name: string;
  message: string;
  exception_type?: string;
  debug?: string;
  arguments?: unknown[];
  context?: Record<string, unknown>;
}

/** Full JSON-RPC 2.0 envelope */
export interface OdooRpcResponse<T> {
  jsonrpc: "2.0";
  id: number | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data: OdooRpcErrorData;
  };
}

/** Odoo client constructor config */
export interface OdooClientConfig {
  url: string;
  db: string;
  user: string;
  apiKey: string;
  /** seconds; default 60 */
  revalidate?: number;
}

// ─── Legacy Odoo wire types (kept for backward compat) ────────────────────────
export interface OdooPageResponse {
  id: number;
  slug: string;
  name: string;
  website_meta_title?: string;
  website_meta_description?: string;
  website_meta_keywords?: string;
  sections?: OdooSectionResponse[];
  write_date?: string;
  create_date?: string;
}

export interface OdooSectionResponse {
  id: number;
  section_type: string;
  sequence: number;
  content: Record<string, unknown>;
}

export interface OdooListResponse<T> {
  records: T[];
  total: number;
}

export interface FetchPagesOptions {
  limit?: number;
  offset?: number;
  published?: boolean;
}

export interface FetchPageOptions {
  slug: string;
  preview?: boolean;
}

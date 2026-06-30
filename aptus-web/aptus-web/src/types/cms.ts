export type OdooWebsitePageRecord = {
  id: number;
  name: string;
  url: string | false;
  arch_db?: string | false;
  arch?: string | false;
  website_meta_title?: string | false;
  website_meta_description?: string | false;
  is_published?: boolean;
  website_published?: boolean;
  header_visible?: boolean;
  footer_visible?: boolean;
  website_id?: [number, string] | false;
  /** Structured homepage JSON (Phase 4) — field name configurable via env. */
  x_homepage_sections_json?: string | false;
  /** Structured ELV page JSON (Phase 4). */
  x_elv_sections_json?: string | false;
  /** Structured Software page JSON (Phase 4). */
  x_software_sections_json?: string | false;
  /** Structured Case Studies page JSON (Phase 4). */
  x_case_studies_sections_json?: string | false;
  /** Structured ETAP product page JSON. */
  x_etap_sections_json?: string | false;
  /** Generic inner-page sections JSON (About Us sub-pages, etc.). */
  x_page_sections_json?: string | false;
  [key: string]: unknown;
};

export type CmsPageContent = {
  id: number;
  name: string;
  url: string;
  html: string;
  metaTitle: string | null;
  metaDescription: string | null;
  /** Raw JSON from Odoo structured homepage field (Phase 4). */
  sectionsJson: string | null;
  source: "odoo";
  odooBaseUrl: string;
};

import etapSections from "../../../content/odoo-json/etap/etap-sections.json";
import { SOFTWARE_INNER_PAGES } from "@/lib/cms/software-inner-pages-content";
import type { EtapPageContent } from "@/types/etap-page";

const config = SOFTWARE_INNER_PAGES.etap;

/** Default ETAP page content — used when Odoo is unavailable or JSON is empty. */
export const DEFAULT_ETAP_PAGE_CONTENT: EtapPageContent = {
  ...(etapSections as EtapPageContent),
  metaTitle: `ETAP | Energy Management Solution | ${config.label}`,
  metaDescription: config.description,
  source: "default",
};

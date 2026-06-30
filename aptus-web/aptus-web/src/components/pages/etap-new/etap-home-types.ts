import type { EtapPageContent } from "@/types/etap-page";
import {
  DEFAULT_ETAP_HOME_INTRO,
  DEFAULT_ETAP_HOME_LEARNING,
  DEFAULT_ETAP_HOME_NAVBAR,
  DEFAULT_ETAP_HOME_PRICING,
  EVENT_ITEMS,
  HERO_SLIDES,
  INDUSTRIES,
  NAV_ITEMS,
  NEWS_ITEMS,
  PRODUCTS,
  TESTIMONIALS,
  VIDEO_ITEMS,
  type EtapHomeIndustry,
  type EtapHomeNavbarCta,
  type EtapHomeTestimonial,
} from "./home-data";

export type EtapHomePageData = {
  source: "odoo" | "default";
  navbar: {
    aptusLogo: string;
    aptusLogoAlt: string;
    etapLogo: string;
    etapLogoAlt: string;
    primaryCta: EtapHomeNavbarCta;
    secondaryCta: EtapHomeNavbarCta;
  };
  intro: {
    headlineHtml: string;
    videoHref: string;
    subtitleHtml: string;
    bodyHtml: string;
  };
  pricing: {
    image: string;
    imageAlt: string;
    title: string;
    description: string;
    ctaHref: string;
    ctaLabel: string;
  };
  learning: {
    text: string;
    ctaLabel: string;
    ctaHref: string;
  };
  industriesTitle: string;
  heroSlides: typeof HERO_SLIDES;
  industries: EtapHomeIndustry[];
  products: typeof PRODUCTS;
  newsItems: typeof NEWS_ITEMS;
  eventItems: typeof EVENT_ITEMS;
  videoItems: typeof VIDEO_ITEMS;
  testimonials: EtapHomeTestimonial[];
  navItems: typeof NAV_ITEMS;
};

export const DEFAULT_ETAP_HOME_PAGE_DATA: EtapHomePageData = {
  source: "default",
  navbar: DEFAULT_ETAP_HOME_NAVBAR,
  intro: DEFAULT_ETAP_HOME_INTRO,
  pricing: DEFAULT_ETAP_HOME_PRICING,
  learning: DEFAULT_ETAP_HOME_LEARNING,
  industriesTitle: "Industries",
  heroSlides: HERO_SLIDES,
  industries: INDUSTRIES,
  products: PRODUCTS,
  newsItems: NEWS_ITEMS,
  eventItems: EVENT_ITEMS,
  videoItems: VIDEO_ITEMS,
  testimonials: TESTIMONIALS,
  navItems: NAV_ITEMS,
};

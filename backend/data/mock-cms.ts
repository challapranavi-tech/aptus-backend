import type { Page, SiteConfig } from "@/types";
import { filterSiteNavigation } from "./autodesk-subnav";
import { SITE_NAVIGATION } from "./site-nav";

/**
 * Mock CMS data layer — development / design preview only.
 * Replace all functions below with Odoo client calls when integration is ready.
 *
 * Content here mirrors the Aptus Infotech site structure so the design renders
 * correctly in development.  Every value reaches components through props only —
 * the components themselves contain zero hard-coded strings.
 */

// ─── Site Config ──────────────────────────────────────────────────────────────
export const mockSiteConfig: SiteConfig = {
  name: "Aptus Infotech",
  logo: {
    src: "/images/Aptus-infotech-orignal-clrs-logo.png",
    alt: "Aptus Infotech",
    width: 2090,
    height: 846,
  },
  topBar: {
    phone: "+968 24238998",
    email: "info@aptusinfotech.com",
    socialLinks: [
      { platform: "facebook", href: "https://www.facebook.com/AptusITsolutions/",                                                    label: "Facebook" },
      { platform: "linkedin", href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all",                       label: "LinkedIn" },
      { platform: "whatsapp", href: "https://wa.me/+968%209941%208481",                                                               label: "WhatsApp" },
      { platform: "twitter",  href: "https://x.com/aptus_infotech",                                                                  label: "Twitter" },
    ],
  },
  navigation: filterSiteNavigation(SITE_NAVIGATION),
  footer: {
    logo: {
      src: "/images/Aptus-infotech-orignal-clrs-logo.png",
      alt: "Aptus Infotech",
      width: 180,
      height: 48,
    },
    tagline:
      "Aptus Infotech is a trusted value-added reseller in Oman with 25 years of industry experience. We deliver complete solutions in Structured Cabling, Data Centers, ELV Security, and Networking. As Gold Partners of leading ISVs like Autodesk, Adobe, and Oracle, we provide genuine software licenses backed by expert support.",
    address:
      "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Diagonally Opposite to 77 Fresh Shopping Center, Ghala Muscat Oman",
    phone: "+968 9941 8481",
    email: "info@aptusinfotech.com",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=H9P9%2BM6+Muscat+Oman&z=15&output=embed",
    socialLinks: [
      { platform: "facebook",  href: "https://www.facebook.com/AptusITsolutions/",                                             label: "Facebook" },
      { platform: "twitter",   href: "https://x.com/aptus_infotech",                                                           label: "Twitter" },
      { platform: "youtube",   href: "https://www.youtube.com/@aptusinfotech",                                                  label: "YouTube" },
      { platform: "linkedin",  href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all",                label: "LinkedIn" },
      { platform: "whatsapp",  href: "https://wa.me/+968%209941%208481",                                                       label: "WhatsApp" },
    ],
    columns: [
      {
        title: "Company",
        links: [
          { label: "About Us",   href: "/about-us" },
          { label: "Training",   href: "/training" },
          { label: "Careers",    href: "/career" },
          { label: "Contact Us", href: "/contact-us" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} Aptus Infotech. All rights reserved.`,
  },
};

// ─── Home page (empty — content from Odoo staging API) ───────────────────────
const homePage: Page = {
  id: "home",
  slug: "home",
  title: "Home",
  seo: {},
  sections: [],
};

// ─── Page registry ────────────────────────────────────────────────────────────
export const mockPages: Page[] = [homePage];

// ─── API surface (mirrors Odoo client surface) ────────────────────────────────
export async function getSiteConfig(): Promise<SiteConfig> {
  return mockSiteConfig;
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return mockPages.find((p) => p.slug === slug) ?? null;
}

export async function getAllPageSlugs(): Promise<string[]> {
  return mockPages.map((page) => page.slug);
}

export async function getHomePage(): Promise<Page | null> {
  return getPageBySlug("home");
}

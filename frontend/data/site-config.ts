import type { SiteConfig } from "@/types";
import { SITE_NAVIGATION } from "./site-nav";
import { filterSiteNavigation } from "./autodesk-subnav";

const LOGO = {
  src: "/images/Aptus-infotech-orignal-clrs-logo.png",
  alt: "Aptus Infotech",
  width: 180,
  height: 48,
} as const;

/** Layout chrome — nav, top bar, and footer (code-owned, not from Odoo). */
export const SITE_CONFIG: SiteConfig = {
  name: "Aptus Infotech",
  logo: LOGO,
  navigation: filterSiteNavigation(SITE_NAVIGATION),
  topBar: {
    phone: "+968 9941 8481",
    email: "info@aptusinfotech.com",
    socialLinks: [
      {
        platform: "facebook",
        href: "https://www.facebook.com/AptusITsolutions/",
        label: "Facebook",
      },
      {
        platform: "linkedin",
        href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all",
        label: "LinkedIn",
      },
      {
        platform: "whatsapp",
        href: "https://api.whatsapp.com/send?phone=96899418481",
        label: "WhatsApp",
      },
      {
        platform: "twitter",
        href: "https://x.com/aptus_infotech",
        label: "Twitter",
      },
    ],
  },
  footer: {
    logo: LOGO,
    tagline:
      "Aptus Infotech is a trusted value-added reseller in Oman with 25 years of industry experience. We deliver complete solutions in Structured Cabling, Data Centers, ELV Security, and Networking. As Gold Partners of leading ISVs like Autodesk, Adobe, and Oracle, we provide genuine software licenses backed by expert support.",
    address:
      "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Diagonally Opposite to 77 Fresh Shopping Center, Ghala Muscat Oman",
    phone: "+968 9941 8481",
    email: "info@aptusinfotech.com",
    mapEmbedUrl: "https://maps.google.com/maps?q=H9P9%2BM6+Muscat+Oman&z=15&output=embed",
    socialLinks: [
      {
        platform: "facebook",
        href: "https://www.facebook.com/AptusITsolutions/",
        label: "Facebook",
      },
      {
        platform: "twitter",
        href: "https://x.com/aptus_infotech",
        label: "Twitter",
      },
      {
        platform: "youtube",
        href: "https://www.youtube.com/@aptusinfotech",
        label: "YouTube",
      },
      {
        platform: "linkedin",
        href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all",
        label: "LinkedIn",
      },
      {
        platform: "whatsapp",
        href: "https://api.whatsapp.com/send?phone=96899418481",
        label: "WhatsApp",
      },
    ],
    columns: [
      {
        title: "Company",
        links: [
          { label: "About Us", href: "/our-story" },
          { label: "Training", href: "/training" },
          { label: "Careers", href: "/careers" },
          { label: "Contact Us", href: "/contact-us" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} Aptus Infotech. All rights reserved.`,
  },
};

import type { SiteConfig } from "@/types";
import { SITE_NAVIGATION } from "./site-nav";
import { filterSiteNavigation } from "./autodesk-subnav";

const LOGO = {
  src: "/images/Aptus-infotech-orignal-clrs-logo.png",
  alt: "Aptus Infotech",
  width: 180,
  height: 48,
} as const;

const FOOTER_SOCIAL_LINKS = [
  {
    platform: "facebook" as const,
    href: "https://www.facebook.com/AptusITsolutions/",
    label: "Facebook",
  },
  {
    platform: "linkedin" as const,
    href: "https://www.linkedin.com/company/aptus-infotech-llc/posts/?feedView=all",
    label: "LinkedIn",
  },
  {
    platform: "whatsapp" as const,
    href: "https://api.whatsapp.com/send?phone=96899418481",
    label: "WhatsApp",
  },
  {
    platform: "twitter" as const,
    href: "https://x.com/aptus_infotech",
    label: "Twitter",
  },
] as const;

/** Layout chrome — nav and footer (code-owned, not from Odoo). */
export const SITE_CONFIG: SiteConfig = {
  name: "Aptus Infotech",
  logo: LOGO,
  navigation: filterSiteNavigation(SITE_NAVIGATION),
  footer: {
    logo: LOGO,
    address:
      "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Diagonally Opposite to 77 Fresh Shopping Center, Ghala Muscat Oman",
    phone: "+968 9941 8481",
    email: "info@aptusinfotech.com",
    mapEmbedUrl: "https://maps.google.com/maps?q=H9P9%2BM6+Muscat+Oman&z=15&output=embed",
    socialLinks: [...FOOTER_SOCIAL_LINKS],
    columns: [
      {
        title: "Company",
        links: [
          { label: "About Us", href: "/our-story" },
          { label: "Our Policies", href: "/aptus-policy" },
          { label: "Careers", href: "/careers" },
          { label: "Contact Us", href: "/contact-us" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} Aptus Infotech. All rights reserved.`,
  },
};

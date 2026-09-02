import type { NavigationItem } from "@/types";

/** Main site navigation — synced from https://aptusinfotech.com/ (see aptus-web/scripts/generate-site-nav.mjs). */

export const SITE_NAVIGATION: NavigationItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Products and Services",
    children: [
      {
        label: "Software",
        href: "/software-solutions",
        children: [
          { label: "Autodesk", href: "/autodesk" },
          { label: "Adobe", href: "/adobe" },
          { label: "Microsoft", href: "/microsoft" },
          { label: "Oracle", href: "/oracle-primavera-p6" },
          { label: "CostX", href: "/rib-costx" },
          { label: "Cubicost", href: "/cubicost-bm-qs" },
          { label: "Planswift", href: "/plainswift" },
          { label: "SpectroNova", href: "/spectronova" },
          { label: "CSI", href: "/computers-structures" },
          { label: "Bentley", href: "/bentley" },
          { label: "Turnitin", href: "/turnitin" },
          { label: "Mathwork", href: "/matlab" },
          { label: "Nitro", href: "/nitro" },
          { label: "Fortinet", href: "/fortinet" },
          { label: "Sophos", href: "/sophos" },
          { label: "Kaspersky", href: "/kaspersky" },
          { label: "Symantec", href: "/antivirus-and-data-security" },
          { label: "Palo Alto", href: "/palo-alto" },
          { label: "RedHAT", href: "/redhat" },
          { label: "Etap", href: "/etap" },
          { label: "Prokon", href: "/prokon" },
          { label: "Lumion", href: "/luminon" },
          { label: "V-Ray", href: "/v-ray" },
          { label: "Sketchup", href: "/sketchup" },
          { label: "Bluebeam", href: "/bluebeam" },
          { label: "Twinmotion", href: "/twinmotion" },
          { label: "Solidworks", href: "/solidworks" },
          { label: "SPSS", href: "/ibm-spss-software" },
          { label: "Corona", href: "/chaos-corona" },
          { label: "D5 Render", href: "/d5-render" },
          { label: "Quorum", href: "/quorum" },
        ],
      },
      {
        label: "ELV Solutions",
        href: "/elv-solutions",
        children: [
          { label: "Access Control System", href: "/access-control-system" },
          { label: "Thermal Scanners", href: "/thermal-scanners" },
          { label: "CCTV", href: "/cctv-camera" },
          { label: "Gate Automation", href: "/gate-automation" },
          { label: "Smart Homes", href: "/home-automation" },
          { label: "Audio/Video Solutions", href: "/audio-video-solutions" },
          { label: "Telephone Systems", href: "/telephone-systems" },
          { label: "Network and Structured Cabling Solutions", href: "/network-and-structured-cabling-solutions" },
          { label: "UPS", href: "/ups" },
          { label: "Guest Room Management", href: "/guest-room-management" },
          { label: "Nurse Calling System", href: "/nurse-calling-system" },
          { label: "SMATV/ IPTV", href: "/smatv-iptv" },
          { label: "Queue Management", href: "/rsi-queue-management" },
          { label: "Data Center Solutions", href: "/data-center-solutions" },
          { label: "Switching and Routing", href: "/switching-and-routing" },
          { label: "Conference room solution", href: "/conference-room-solution" },
        ],
      },
    ],
  },
  {
    label: "Knowledge Hub",
    children: [
      { label: "Blog", href: "/our-story" },
      { label: "Customer Stories", href: "/winning-together" },
      { label: "Knowledge Base", href: "/software-solutions" },
      { label: "FAQ", href: "/contact-us" },
      { label: "Documentation", href: "/aptus-policy" },
      { label: "Resources", href: "/why-aptus-infotech" },
      { label: "Academy", href: "/training" },
    ],
  },
  {
    label: "About Us",
    href: "/our-story",
    children: [
      { label: "Our Team", href: "/our-team" },
      { label: "Our Story", href: "/our-story" },
      { label: "Aptus Policy", href: "/aptus-policy" },
      { label: "Why Aptus Infotech", href: "/why-aptus-infotech" },
      { label: "Winning together", href: "/winning-together" },
      { label: "Aptus Infotech ISO Certifications", href: "/aptus-infotech-iso-certifications" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
];

/** Find a nav item by label at any depth. */
export function findNavItemByLabel(
  items: NavigationItem[],
  label: string,
): NavigationItem | undefined {
  for (const item of items) {
    if (item.label === label) return item;
    if (item.children?.length) {
      const nested = findNavItemByLabel(item.children, label);
      if (nested) return nested;
    }
  }
  return undefined;
}

const SOFTWARE_BRAND_COUNT = 31;

// ponytail: self-check — Software + ELV live under Products and Services (exactly two hubs)
const products = SITE_NAVIGATION.find((item) => item.label === "Products and Services");
const software = products?.children?.find((item) => item.label === "Software");
const elv = products?.children?.find((item) => item.label === "ELV Solutions");
if (!products?.children || products.children.length !== 2) {
  throw new Error("SITE_NAVIGATION Products and Services must contain exactly Software and ELV Solutions");
}
if (!software?.children || software.children.length !== SOFTWARE_BRAND_COUNT) {
  throw new Error(`SITE_NAVIGATION Software menu must contain exactly ${SOFTWARE_BRAND_COUNT} brands`);
}
if (!elv?.children?.length) {
  throw new Error("SITE_NAVIGATION ELV Solutions menu missing under Products and Services");
}

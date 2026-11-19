import { SOFTWARE_SOLUTION_PAGES, softwareSolutionHref } from "@/data/software-solution-pages";
import type { NavigationItem } from "@/types";

/** Main site navigation — synced from https://aptusinfotech.com/ (see aptus-web/scripts/generate-site-nav.mjs). */

export const SITE_NAVIGATION: NavigationItem[] = [
  {
    label: "About Us",
    href: "/our-story",
    children: [
      { label: "Our Story", href: "/our-story" },
      { label: "Our Team", href: "/our-team" },
      { label: "ISO Certifications", href: "/aptus-infotech-iso-certifications" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  {
    label: "Products and Solutions",
    children: [
      {
        label: "Software",
        href: "/software-solutions",
        children: [
          { label: "Adobe", href: "/adobe" },
          { label: "Autodesk", href: "/autodesk" },
          { label: "Microsoft", href: "/microsoft" },
          { label: "Oracle", href: "/oracle-primavera-p6" },
          ...SOFTWARE_SOLUTION_PAGES.map((page) => ({
            label: page.label,
            href: softwareSolutionHref(page.slug),
          })),
        ],
      },
      {
        label: "ELV Solutions",
        href: "/elv-solutions",
        children: [
          { label: "CCTV", href: "/cctv-camera" },
          { label: "Access Control System", href: "/access-control-system" },
          { label: "Gate Automation", href: "/gate-automation" },
          { label: "Audio/Video Solutions", href: "/audio-video-solutions" },
          { label: "Smart Homes", href: "/home-automation" },
          { label: "Telephone Systems", href: "/telephone-systems" },
          { label: "Network and Structured Cabling Solutions", href: "/network-and-structured-cabling-solutions" },
          { label: "Thermal Scanners", href: "/thermal-scanners" },
          { label: "UPS", href: "/ups" },
          { label: "Guest Room Management", href: "/guest-room-management" },
          { label: "Nurse Calling System", href: "/nurse-calling-system" },
          { label: "Conference Room Solution", href: "/conference-room-solution" },
          { label: "SMATV/IPTV", href: "/smatv-iptv" },
          { label: "Switching and Routing", href: "/switching-and-routing" },
          { label: "Data Center Solutions", href: "/data-center-solutions" },
          { label: "Queue Management", href: "/rsi-queue-management" },
        ],
      },
      {
        label: "Aptus Solar",
        href: "https://www.aptussolartech.com/",
      },
    ],
  },
  {
    label: "Knowledge Hub",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "Solutions in Action", href: "/customer-stories" },
      { label: "Knowledge Base", href: "/software-solutions" },
      { label: "FAQ", href: "/faq" },
      // Events + Gallery hidden from the Knowledge Hub menu (pages may still exist).
    ],
  },
  { label: "Careers", href: "/careers" },
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

const SOFTWARE_SHORTCUTS = ["Adobe", "Autodesk", "Microsoft", "Oracle"];

// ponytail: self-check — Software + ELV + Aptus Solar under Products and Solutions
const products = SITE_NAVIGATION.find((item) => item.label === "Products and Solutions");
const software = products?.children?.find((item) => item.label === "Software");
const elv = products?.children?.find((item) => item.label === "ELV Solutions");
const solar = products?.children?.find((item) => item.label === "Aptus Solar");
if (!products?.children || products.children.length !== 3) {
  throw new Error(
    "SITE_NAVIGATION Products and Solutions must contain Software, ELV Solutions, and Aptus Solar",
  );
}
const softwareTop = software?.children ?? [];
const softwareSolutions = softwareTop.filter((item) => !SOFTWARE_SHORTCUTS.includes(item.label));
if (softwareTop.slice(0, SOFTWARE_SHORTCUTS.length).map((item) => item.label).join("|") !== SOFTWARE_SHORTCUTS.join("|")) {
  throw new Error("SITE_NAVIGATION Software menu must list Adobe, Autodesk, Microsoft, and Oracle first");
}
if (softwareSolutions.map((item) => item.label).join("|") !== SOFTWARE_SOLUTION_PAGES.map((page) => page.label).join("|")) {
  throw new Error("SITE_NAVIGATION Software solution pages are out of order");
}
if (softwareSolutions.some((item) => item.children?.length || item.href !== softwareSolutionHref(SOFTWARE_SOLUTION_PAGES.find((page) => page.label === item.label)?.slug ?? ""))) {
  throw new Error("SITE_NAVIGATION Software solutions must link to their pages, with no inner menu");
}
if (!elv?.children?.length) {
  throw new Error("SITE_NAVIGATION ELV Solutions menu missing under Products and Solutions");
}
if (!solar?.href) {
  throw new Error("SITE_NAVIGATION Aptus Solar hub missing under Products and Solutions");
}

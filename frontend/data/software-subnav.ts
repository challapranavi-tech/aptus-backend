import { AUTODESK_SUBNAV_LINKS } from "@/data/autodesk-subnav";
import { SITE_NAVIGATION } from "@/data/site-nav";

export type SoftwareSubNavLink = { label: string; href: string };

function flattenChildren(children: { label: string; href?: string; children?: { label: string; href?: string }[] }[]): SoftwareSubNavLink[] {
  const out: SoftwareSubNavLink[] = [];
  for (const child of children) {
    if (child.href && child.href !== "#") out.push({ label: child.label, href: child.href });
    if (child.children?.length) out.push(...flattenChildren(child.children));
  }
  return out;
}

function linksFromCategory(label: string): SoftwareSubNavLink[] {
  const software = SITE_NAVIGATION.find((item) => item.label === "Software");
  const category = software?.children?.find((c) => c.label === label);
  return category?.children ? flattenChildren(category.children) : [];
}

function linksFromTopNav(label: string): SoftwareSubNavLink[] {
  const item = SITE_NAVIGATION.find((nav) => nav.label === label);
  return item?.children ? flattenChildren(item.children) : [];
}

export const ADOBE_SUBNAV_LINKS = linksFromCategory("Adobe");
export const MICROSOFT_SUBNAV_LINKS = linksFromCategory("Microsoft");
export const MULTIMEDIA_SUBNAV_LINKS = linksFromCategory("Multimedia");
export const ORACLE_SUBNAV_LINKS = linksFromCategory("Oracle");
export const EDMS_SUBNAV_LINKS = linksFromCategory("EDMS");
export const ELECTRICAL_SOFTWARE_SUBNAV_LINKS = linksFromCategory("Electrical Software");

/** Live sidebar on Educational Software pages (post-2091 ANSYS). */
export const EDUCATIONAL_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Matlab", href: "/matlab" },
  { label: "Turnitin", href: "/turnitin" },
  { label: "IBM SPSS Software", href: "/ibm-spss-software" },
  { label: "ANSYS", href: "/ansys" },
];
export const ELV_SUBNAV_LINKS = linksFromTopNav("ELV Solutions");

/** Live sidebar on Quantity Takeoff product pages. */
export const QUANTITY_TAKEOFF_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Cubicost BM QS", href: "/cubicost-bm-qs" },
  { label: "Planswift", href: "/plainswift" },
  { label: "RIB CostX", href: "/rib-costx" },
];

/** Live sidebar on Antivirus and Data Security (post-1012). */
export const ANTIVIRUS_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Antivirus and Data Security", href: "/antivirus-and-data-security" },
  { label: "AutoDesk", href: "/autodesk" },
  { label: "Adobe", href: "/adobe" },
  { label: "SpectroNova", href: "/spectronova" },
  { label: "Prokon", href: "/prokon" },
  { label: "SonicWall Next-Gen Firewall", href: "/sonicwall-next-gen-firewall" },
  { label: "Oracle Primavera P6", href: "/oracle-primavera-p6" },
  { label: "Autodesk Construction Cloud", href: "/construction-cloud" },
];

/** Live sidebar on Water Infrastructure product pages (post-3188 InfoDrainage et al.). */
export const WATER_INFRASTRUCTURE_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "InfoDrainage", href: "/infodrainage" },
  { label: "InfoWater Pro", href: "/infowater-pro" },
  { label: "InfoWorks ICM", href: "/infoworks-icm" },
  { label: "InfoWorks WS Pro", href: "/infoworks-ws-pro" },
];

/** Live sidebar on Cyber Security product pages (post-2786 Fortinet et al.). */
export const CYBER_SECURITY_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Fortinet", href: "/fortinet" },
  { label: "Sophos", href: "/sophos" },
  { label: "SonicWall Next-Gen Firewall", href: "/sonicwall-next-gen-firewall" },
  { label: "Kaspersky", href: "/kaspersky" },
  { label: "Palo Alto", href: "/palo-alto" },
];

/** Live sidebar on Structural Software pages (post-291 CSI + Prokon). */
export const STRUCTURAL_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Computers & Structures, Inc", href: "/computers-structures" },
  { label: "Prokon", href: "/prokon" },
];

/** @deprecated alias — use structural */
export const CSI_SUBNAV_LINKS = STRUCTURAL_SUBNAV_LINKS;

/** Live sidebar on Cubicost / Construction Cloud / CYPE pages. */
export const CUBICOST_GROUP_SUBNAV_LINKS: SoftwareSubNavLink[] = [
  { label: "Autodesk Construction Cloud", href: "/construction-cloud" },
  { label: "Cubicost BM QS", href: "/cubicost-bm-qs" },
  { label: "CYPE", href: "/cype" },
];

export const SOFTWARE_SUBNAV_BY_FAMILY: Record<string, SoftwareSubNavLink[]> = {
  autodesk: [...AUTODESK_SUBNAV_LINKS],
  adobe: ADOBE_SUBNAV_LINKS,
  microsoft: MICROSOFT_SUBNAV_LINKS,
  multimedia: MULTIMEDIA_SUBNAV_LINKS,
  oracle: ORACLE_SUBNAV_LINKS,
  edms: EDMS_SUBNAV_LINKS,
  educational: EDUCATIONAL_SUBNAV_LINKS,
  elv: ELV_SUBNAV_LINKS,
  "cubicost-group": CUBICOST_GROUP_SUBNAV_LINKS,
  structural: STRUCTURAL_SUBNAV_LINKS,
  csi: STRUCTURAL_SUBNAV_LINKS,
  "quantity-takeoff": QUANTITY_TAKEOFF_SUBNAV_LINKS,
  "cyber-security": CYBER_SECURITY_SUBNAV_LINKS,
  "water-infrastructure": WATER_INFRASTRUCTURE_SUBNAV_LINKS,
  antivirus: ANTIVIRUS_SUBNAV_LINKS,
};

export function softwareSubnavForFamily(family?: string): SoftwareSubNavLink[] | undefined {
  if (!family) return undefined;
  const key = family === "csi" ? "structural" : family;
  return SOFTWARE_SUBNAV_BY_FAMILY[key];
}

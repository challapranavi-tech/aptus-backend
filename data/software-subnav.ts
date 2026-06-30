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
export const ELV_SUBNAV_LINKS = linksFromTopNav("ELV Solutions");

export const SOFTWARE_SUBNAV_BY_FAMILY: Record<string, SoftwareSubNavLink[]> = {
  autodesk: [...AUTODESK_SUBNAV_LINKS],
  adobe: ADOBE_SUBNAV_LINKS,
  microsoft: MICROSOFT_SUBNAV_LINKS,
  multimedia: MULTIMEDIA_SUBNAV_LINKS,
  oracle: ORACLE_SUBNAV_LINKS,
  edms: EDMS_SUBNAV_LINKS,
  educational: ELECTRICAL_SOFTWARE_SUBNAV_LINKS,
  elv: ELV_SUBNAV_LINKS,
};

export function softwareSubnavForFamily(family?: string): SoftwareSubNavLink[] | undefined {
  if (!family) return undefined;
  return SOFTWARE_SUBNAV_BY_FAMILY[family];
}

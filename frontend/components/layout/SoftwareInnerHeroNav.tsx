"use client";

import { usePathname } from "next/navigation";
import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import { isAutodeskHiddenSlug } from "@/data/autodesk-subnav";
import {
  softwareSubnavForFamily,
  STRUCTURAL_SUBNAV_LINKS,
  type SoftwareSubNavLink,
} from "@/data/software-subnav";

const STRUCTURAL_PATHS = new Set(["/computers-structures", "/prokon"]);

function subnavLabel(family?: string): string {
  if (family === "elv") return "ELV Solutions";
  if (family === "software" || family === "software-solutions") return "Software Solutions";
  if (family === "educational") return "Educational Software";
  if (family === "cubicost-group") return "Software products";
  if (family === "structural" || family === "csi") return "Structural Software";
  if (family === "quantity-takeoff") return "Quantity Takeoff";
  if (family === "cyber-security") return "Cyber Security";
  return `${family ?? "Software"} products`;
}

function withoutHidden(links: SoftwareSubNavLink[]): SoftwareSubNavLink[] {
  return links.filter((l) => !isAutodeskHiddenSlug(l.href.replace(/^\//, "")));
}

export function SoftwareInnerHeroNav({
  family,
  links,
}: {
  family?: string;
  links?: SoftwareSubNavLink[];
}) {
  const pathname = usePathname();
  // Family registry wins when present so sidebars stay in sync with header nav.
  const familyLinks = softwareSubnavForFamily(family);
  const fromData = familyLinks?.length ? familyLinks : links?.length ? links : undefined;
  const resolved = withoutHidden(
    fromData?.length
      ? fromData
      : STRUCTURAL_PATHS.has(pathname)
        ? [...STRUCTURAL_SUBNAV_LINKS]
        : [],
  );

  if (!resolved.length) return null;

  return <SoftwareSubNav links={resolved} label={subnavLabel(family)} />;
}

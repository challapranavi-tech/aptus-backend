"use client";

import { usePathname } from "next/navigation";
import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import {
  softwareSubnavForFamily,
  STRUCTURAL_SUBNAV_LINKS,
  type SoftwareSubNavLink,
} from "@/data/software-subnav";

const STRUCTURAL_PATHS = new Set(["/computers-structures", "/prokon"]);

function subnavLabel(family?: string): string {
  if (family === "elv") return "ELV Solutions";
  if (family === "educational") return "Educational Software";
  if (family === "cubicost-group") return "Software products";
  if (family === "structural" || family === "csi") return "Structural Software";
  if (family === "quantity-takeoff") return "Quantity Takeoff";
  if (family === "cyber-security") return "Cyber Security";
  return `${family ?? "Software"} products`;
}

export function SoftwareInnerHeroNav({
  family,
  links,
}: {
  family?: string;
  links?: SoftwareSubNavLink[];
}) {
  const pathname = usePathname();
  const fromData = links?.length ? links : softwareSubnavForFamily(family);
  const resolved =
    fromData?.length ? fromData : STRUCTURAL_PATHS.has(pathname) ? STRUCTURAL_SUBNAV_LINKS : [];

  if (!resolved.length) return null;

  return <SoftwareSubNav links={resolved} label={subnavLabel(family)} />;
}

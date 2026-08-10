"use client";

import { SoftwareSubNav } from "@/components/layout/SoftwareSubNav";
import { AUTODESK_SUBNAV_LINKS } from "@/data/autodesk-subnav";

/** @deprecated Use SoftwareSubNav — kept for backwards compatibility. */
export function AutodeskSubNav() {
  return <SoftwareSubNav links={AUTODESK_SUBNAV_LINKS} label="Autodesk products" />;
}

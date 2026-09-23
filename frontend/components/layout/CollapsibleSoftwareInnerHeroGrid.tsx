"use client";

import { SoftwareInnerHeroNav } from "@/components/layout/SoftwareInnerHeroNav";
import { cn } from "@/lib/utils";
import type { SoftwareSubNavLink } from "@/data/software-subnav";
import { useState, type ReactNode } from "react";

type CollapsibleSoftwareInnerHeroGridProps = {
  family?: string;
  links?: SoftwareSubNavLink[];
  isTwoColumn?: boolean;
  inlineMedia?: boolean;
  children: ReactNode;
};

export function CollapsibleSoftwareInnerHeroGrid({
  family,
  links,
  isTwoColumn,
  inlineMedia,
  children,
}: CollapsibleSoftwareInnerHeroGridProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "aptus-software-inner-hero__grid",
        isTwoColumn && "aptus-software-inner-hero__grid--two-column",
        inlineMedia && "aptus-software-inner-hero__grid--inline-media",
        navCollapsed && "aptus-software-inner-hero__grid--nav-collapsed",
      )}
      data-nav-collapsed={navCollapsed ? "true" : "false"}
    >
      <aside
        className={cn(
          "aptus-software-inner-hero__nav",
          navCollapsed && "aptus-software-inner-hero__nav--collapsed",
        )}
      >
        <button
          type="button"
          className="aptus-software-inner-hero__nav-toggle"
          aria-expanded={!navCollapsed}
          aria-controls="aptus-software-inner-hero-subnav"
          aria-label={navCollapsed ? "Show menu" : "Hide menu"}
          onClick={() => setNavCollapsed((value) => !value)}
        >
          <span aria-hidden="true">{navCollapsed ? "›" : "‹"}</span>
        </button>
        <div
          id="aptus-software-inner-hero-subnav"
          className="aptus-software-inner-hero__nav-panel"
          hidden={navCollapsed}
        >
          <SoftwareInnerHeroNav family={family} links={links} />
        </div>
      </aside>
      {children}
    </div>
  );
}

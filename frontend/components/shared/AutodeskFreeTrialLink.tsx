"use client";

import { usePathname } from "next/navigation";
import { getAutodeskTrialUrl } from "@/data/autodesk-trial-urls";

type AutodeskFreeTrialLinkProps = {
  /** Product marketing href (e.g. /autocad). Falls back to the current pathname. */
  productHref?: string;
  variant?: "portal-detail" | "portal-card" | "marketing";
  className?: string;
};

export function AutodeskFreeTrialLink({
  productHref,
  variant = "portal-detail",
  className,
}: AutodeskFreeTrialLinkProps) {
  const pathname = usePathname();
  const trialUrl = getAutodeskTrialUrl(productHref ?? pathname ?? "");
  if (!trialUrl) return null;

  if (variant === "portal-card") {
    return (
      <a
        href={trialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? "aptus-portal-btn aptus-portal-btn--trial"}
      >
        Free Trial
      </a>
    );
  }

  if (variant === "marketing") {
    return (
      <a
        href={trialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? "aptus-software-btn aptus-software-btn-green"}
      >
        Free Trial
      </a>
    );
  }

  return (
    <a
      href={trialUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "aptus-product-detail__btn aptus-product-detail__btn--trial"}
    >
      Free Trial
    </a>
  );
}

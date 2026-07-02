import { isElvHubSlug, isElvInnerSlug } from "@/data/elv-product-media";

export type ElvPageScope = {
  isHub: boolean;
  isInner: boolean;
  wrapperClass: string;
};

export function getElvPageScope(slug: string): ElvPageScope | null {
  if (isElvHubSlug(slug)) {
    return {
      isHub: true,
      isInner: false,
      wrapperClass: "aptus-elv-page aptus-elv-page--elv-solutions",
    };
  }

  if (isElvInnerSlug(slug)) {
    return {
      isHub: false,
      isInner: true,
      wrapperClass: `aptus-elv-page aptus-elv-page--${slug}`,
    };
  }

  return null;
}

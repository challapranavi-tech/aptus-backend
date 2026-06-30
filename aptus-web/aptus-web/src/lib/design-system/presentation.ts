/**
 * Maps Odoo CMS presentation presets to React data attributes and Tailwind class sets.
 * Odoo stores enum values; Next.js owns the visual mapping.
 */

export type CmsTheme = "light" | "dark";
export type CmsAlignment = "left" | "center" | "right";
export type CmsFontPreset = "inter" | "poppins" | "manrope";
export type CmsFontScale = "small" | "medium" | "large";
export type CmsColorPreset = "brand-blue" | "brand-green" | "brand-purple";
export type CmsComponentVariant = "standard" | "compact" | "featured";

export type CmsPresentationSettings = {
  theme?: CmsTheme;
  alignment?: CmsAlignment;
  fontPreset?: CmsFontPreset;
  fontScale?: CmsFontScale;
  colorPreset?: CmsColorPreset;
  variant?: CmsComponentVariant;
  visible?: boolean;
};

const COLOR_PRESET_ATTR: Record<CmsColorPreset, string> = {
  "brand-blue": "blue",
  "brand-green": "green",
  "brand-purple": "purple",
};

const ALIGNMENT_CLASS: Record<CmsAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const VARIANT_SECTION_CLASS: Record<CmsComponentVariant, string> = {
  standard: "py-section",
  compact: "py-10",
  featured: "py-section-lg",
};

/** Data attributes for scoped CSS token overrides on a section root. */
export function cmsPresentationDataAttrs(
  settings: CmsPresentationSettings,
): Record<string, string | undefined> {
  return {
    "data-aptus-theme": settings.theme,
    "data-aptus-font": settings.fontPreset,
    "data-aptus-font-scale": settings.fontScale === "medium" ? undefined : settings.fontScale,
    "data-aptus-color": settings.colorPreset
      ? COLOR_PRESET_ATTR[settings.colorPreset]
      : undefined,
  };
}

/** Tailwind classes derived from CMS presentation settings. */
export function cmsPresentationClasses(settings: CmsPresentationSettings): string {
  const classes: string[] = [];

  if (settings.alignment) {
    classes.push(ALIGNMENT_CLASS[settings.alignment]);
  }

  if (settings.variant) {
    classes.push(VARIANT_SECTION_CLASS[settings.variant]);
  }

  if (settings.visible === false) {
    classes.push("hidden");
  }

  return classes.filter(Boolean).join(" ");
}

/** Normalize raw Odoo enum strings (case/spacing tolerant). */
export function parseCmsPresentation(raw: Record<string, unknown>): CmsPresentationSettings {
  const str = (key: string) =>
    typeof raw[key] === "string" ? raw[key].toLowerCase().trim().replace(/\s+/g, "-") : undefined;

  const theme = str("theme");
  const alignment = str("alignment");
  const fontPreset = str("font_preset") ?? str("fontPreset");
  const fontScale = str("font_scale") ?? str("fontScale");
  const colorPreset = str("color_preset") ?? str("colorPreset");
  const variant = str("variant") ?? str("component_variant");

  return {
    theme: theme === "dark" ? "dark" : theme === "light" ? "light" : undefined,
    alignment:
      alignment === "center" || alignment === "right" || alignment === "left"
        ? alignment
        : undefined,
    fontPreset:
      fontPreset === "inter" || fontPreset === "poppins" || fontPreset === "manrope"
        ? fontPreset
        : undefined,
    fontScale:
      fontScale === "small" || fontScale === "medium" || fontScale === "large"
        ? fontScale
        : undefined,
    colorPreset:
      colorPreset === "brand-blue" ||
      colorPreset === "brand-green" ||
      colorPreset === "brand-purple"
        ? colorPreset
        : undefined,
    variant:
      variant === "standard" || variant === "compact" || variant === "featured"
        ? variant
        : undefined,
    visible: raw.visible === false || raw.visible === "hide" ? false : undefined,
  };
}

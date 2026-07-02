/**
 * lib/design-system/presentation.ts
 *
 * Translates Odoo CMS presentation presets into HTML data attributes and
 * Tailwind utility classes. Odoo stores only enum values (never raw CSS).
 * Next.js owns every visual mapping — this file is the contract boundary.
 *
 * Implementation rule:
 *   Odoo JSON → parseCmsPresentation() → CmsPresentationSettings
 *   CmsPresentationSettings → cmsPresentationDataAttrs() → data-aptus-* HTML attrs
 *   CmsPresentationSettings → cmsPresentationClasses() → Tailwind class string
 *
 * CSS selectors for data-aptus-* attrs live in globals.css, not here.
 */

import type {
  CmsAlignment,
  CmsColorPreset,
  CmsComponentVariant,
  CmsFontPreset,
  CmsFontScale,
  CmsPresentationSettings,
  CmsTheme,
} from "@/types";

// ─── Preset → class maps ──────────────────────────────────────────────────────

const ALIGNMENT_CLASS: Record<CmsAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// Root app uses custom utility classes from globals.css (Tailwind v4 @layer utilities)
const VARIANT_CLASS: Record<CmsComponentVariant, string> = {
  standard: "section-padding",
  compact: "py-10",
  featured: "section-padding-lg",
};

const COLOR_ATTR: Record<CmsColorPreset, string> = {
  "brand-blue": "blue",
  "brand-green": "green",
  "brand-purple": "purple",
};

// ─── Resolvers ────────────────────────────────────────────────────────────────

/**
 * Returns HTML data attributes for scoped CSS token overrides on a section root.
 * These are consumed by CSS selectors like `[data-aptus-theme="dark"] { ... }`.
 */
export function cmsPresentationDataAttrs(
  settings: CmsPresentationSettings,
): Record<string, string | undefined> {
  return {
    "data-aptus-theme": settings.theme,
    "data-aptus-font": settings.fontPreset,
    // Omit "medium" (the default) to avoid redundant attribute noise
    "data-aptus-font-scale": settings.fontScale === "medium" ? undefined : settings.fontScale,
    "data-aptus-color": settings.colorPreset ? COLOR_ATTR[settings.colorPreset] : undefined,
  };
}

/**
 * Returns a Tailwind class string derived from CMS presentation settings.
 * Only includes classes for settings that deviate from defaults.
 */
export function cmsPresentationClasses(settings: CmsPresentationSettings): string {
  const classes: string[] = [];

  if (settings.alignment) {
    classes.push(ALIGNMENT_CLASS[settings.alignment]);
  }

  if (settings.variant) {
    classes.push(VARIANT_CLASS[settings.variant]);
  }

  return classes.filter(Boolean).join(" ");
}

// ─── Parser ───────────────────────────────────────────────────────────────────

const VALID_THEMES = new Set<CmsTheme>(["light", "dark"]);
const VALID_ALIGNMENTS = new Set<CmsAlignment>(["left", "center", "right"]);
const VALID_FONT_PRESETS = new Set<CmsFontPreset>(["inter", "poppins", "manrope"]);
const VALID_FONT_SCALES = new Set<CmsFontScale>(["small", "medium", "large"]);
const VALID_COLOR_PRESETS = new Set<CmsColorPreset>(["brand-blue", "brand-green", "brand-purple"]);
const VALID_VARIANTS = new Set<CmsComponentVariant>(["standard", "compact", "featured"]);

/**
 * Parses a raw Odoo JSON object into a validated CmsPresentationSettings.
 * Accepts both camelCase and snake_case key variants; normalises to lowercase-kebab.
 * Unknown / out-of-set values are silently dropped (never throw on bad CMS data).
 */
export function parseCmsPresentation(raw: Record<string, unknown>): CmsPresentationSettings {
  const str = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      if (typeof raw[key] === "string") {
        return raw[key].toLowerCase().trim().replace(/\s+/g, "-");
      }
    }
    return undefined;
  };

  const theme = str("theme");
  const alignment = str("alignment");
  const fontPreset = str("fontPreset", "font_preset");
  const fontScale = str("fontScale", "font_scale");
  const colorPreset = str("colorPreset", "color_preset");
  const variant = str("variant", "componentVariant", "component_variant");

  return {
    theme: VALID_THEMES.has(theme as CmsTheme) ? (theme as CmsTheme) : undefined,
    alignment: VALID_ALIGNMENTS.has(alignment as CmsAlignment)
      ? (alignment as CmsAlignment)
      : undefined,
    fontPreset: VALID_FONT_PRESETS.has(fontPreset as CmsFontPreset)
      ? (fontPreset as CmsFontPreset)
      : undefined,
    fontScale: VALID_FONT_SCALES.has(fontScale as CmsFontScale)
      ? (fontScale as CmsFontScale)
      : undefined,
    colorPreset: VALID_COLOR_PRESETS.has(colorPreset as CmsColorPreset)
      ? (colorPreset as CmsColorPreset)
      : undefined,
    variant: VALID_VARIANTS.has(variant as CmsComponentVariant)
      ? (variant as CmsComponentVariant)
      : undefined,
    // `visible: false` or `visible: "hide"` hides the section; anything else → undefined (shown by default)
    visible:
      raw.visible === false || raw.visible === "hide" || raw.visible === "false"
        ? false
        : undefined,
  };
}
